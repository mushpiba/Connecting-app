/**
 * 증상 글을 읽고 진료과 후보를 고른다.
 *
 * 이 함수가 존재하는 이유는 하나다. Anthropic API 키가 브라우저에 있으면 안
 * 된다. 브라우저에 내려간 값은 공개된 값이고, 그 키로는 우리 계정 요금이
 * 나간다. 키는 Supabase 비밀값으로 두고 여기서만 읽는다.
 *
 * 배포:
 *   supabase secrets set ANTHROPIC_API_KEY=...   ← 사람이 직접, 한 번만
 *   supabase functions deploy classify-symptoms
 *
 * 진단명을 만들지 않는다. 고를 수 있는 값은 아래 목록뿐이고, 근거는 환자가 쓴
 * 말을 그대로 옮긴 것만 받는다. 화면도 한 번 더 거른다.
 */

const SPECIALTIES = [
  'internal-medicine',
  'family-medicine',
  'otolaryngology',
  'dermatology',
  'orthopedics',
  'psychiatry',
  'ophthalmology',
  'obgyn',
  'pediatrics',
  'urology',
] as const

const SYSTEM = `당신은 한국어 증상 글을 읽고 어느 진료과로 가면 좋을지 후보를 고릅니다.

규칙:
- 진단명, 병명, 확률을 절대 만들지 마세요. 진료과만 고릅니다.
- specialty 는 반드시 다음 중 하나입니다: ${SPECIALTIES.join(', ')}
- evidence 는 환자가 쓴 글에 **그대로 있는 표현**만 옮겨 적습니다. 의학 용어로
  바꾸지 마세요. 글에 없는 말을 지어내면 안 됩니다.
- 후보는 최대 2개. 확실하지 않으면 1개만, 정말 모르겠으면 빈 배열.
- 오직 JSON 배열만 출력합니다. 설명 문장을 붙이지 마세요.

출력 형식:
[{"specialty":"otolaryngology","evidence":["목이 아프고","침 삼킬 때"]}]`

Deno.serve(async (request: Request) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
  }

  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const key = Deno.env.get('ANTHROPIC_API_KEY')
  if (!key) {
    return new Response(JSON.stringify({ error: 'not-configured' }), {
      status: 503,
      headers: { ...cors, 'content-type': 'application/json' },
    })
  }

  let text = ''
  try {
    const body = await request.json()
    text = typeof body.text === 'string' ? body.text.slice(0, 2000) : ''
  } catch {
    text = ''
  }

  if (text.trim().length < 4) {
    return new Response(JSON.stringify([]), {
      headers: { ...cors, 'content-type': 'application/json' },
    })
  }

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: SYSTEM,
      messages: [{ role: 'user', content: text }],
    }),
  })

  if (!upstream.ok) {
    return new Response(JSON.stringify({ error: 'upstream' }), {
      status: 502,
      headers: { ...cors, 'content-type': 'application/json' },
    })
  }

  const payload = await upstream.json()
  const raw = payload?.content?.[0]?.text ?? '[]'

  // 모델이 무엇을 뱉든 우리가 아는 모양만 통과시킨다.
  let parsed: unknown = []
  try {
    parsed = JSON.parse(raw)
  } catch {
    parsed = []
  }

  const verdicts = (Array.isArray(parsed) ? parsed : [])
    .filter(
      (item): item is { specialty: string; evidence: unknown } =>
        typeof item?.specialty === 'string' &&
        (SPECIALTIES as readonly string[]).includes(item.specialty),
    )
    .slice(0, 2)
    .map((item) => ({
      specialty: item.specialty,
      evidence: (Array.isArray(item.evidence) ? item.evidence : [])
        .filter((word: unknown): word is string => typeof word === 'string')
        .filter((word: string) => text.includes(word))
        .slice(0, 4),
    }))

  return new Response(JSON.stringify(verdicts), {
    headers: { ...cors, 'content-type': 'application/json' },
  })
})
