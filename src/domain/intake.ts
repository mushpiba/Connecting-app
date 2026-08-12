import type { BodyArea, IntakeForm, IntakeRuleSet, Specialty, TriageResult } from './types'

/**
 * 문진 양식을 진료과 분류에 넣을 한 덩어리 문장으로 만든다.
 *
 * 자유 텍스트와 고른 증상 칩은 그대로 쓰고, 체크한 부위만 키워드로 펼쳐 붙인다.
 * 칩은 환자가 직접 고른 말이라 근거로 표시해도 지어낸 말이 되지 않는다.
 * 펼친 토큰은 분류에만 쓰고 게시글 본문에는 넣지 않는다. matchDoctors는
 * 환자가 실제로 쓴 문장만 보므로 의사 키워드 매칭이 부풀지 않는다.
 */
export function buildTriageText(form: IntakeForm, ruleSet: IntakeRuleSet): string {
  const expansions = form.bodyAreas.flatMap((area) => ruleSet.areaKeywords[area] ?? [])

  return [form.title, form.body, ...form.selectedSymptoms, ...expansions]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** 증상 시작일부터 기준일까지 며칠째인지. 기준일은 항상 인자로 받는다. */
export function symptomDurationDays(onsetDate: string, today: string): number {
  const start = Date.parse(`${onsetDate}T00:00:00Z`)
  const end = Date.parse(`${today}T00:00:00Z`)
  if (Number.isNaN(start) || Number.isNaN(end)) return 0

  return Math.max(0, Math.round((end - start) / 86_400_000)) + 1
}

/** 진료 이력을 밝히지 않았으면 그 의사에게만 공개하는 범위를 고를 수 없다. */
export function canChoosePriorClinicOnly(form: Pick<IntakeForm, 'priorVisit'>): boolean {
  return form.priorVisit !== null
}

/**
 * 진료과 분류 결과를 문진 부위로 되돌린다.
 *
 * 환자가 부위 체크를 건너뛰어도 적은 내용에서 범주를 잡아 그 범주의 문항을 연다.
 *
 * 추론은 가장 점수가 높은 하나만 쓴다. 후보 셋을 전부 열면 콧물 이야기에
 * 수면과 전신 문항까지 따라붙어 물어볼 것이 서른 개가 된다. 나머지 범주가
 * 필요하면 환자가 부위를 직접 고르면 된다.
 */
const specialtyAreas: Record<Specialty, BodyArea> = {
  otolaryngology: 'ent',
  'internal-medicine': 'digestive',
  'family-medicine': 'general',
  dermatology: 'skin',
  orthopedics: 'musculoskeletal',
  psychiatry: 'mind',
  ophthalmology: 'eye',
  obgyn: 'womens',
  pediatrics: 'child',
  urology: 'urinary',
}

/**
 * 추론으로는 절대 열지 않는 범주.
 *
 * 키워드 한 번 스친 것으로 마지막 생리 시작일을 묻게 되면, 그건 잘못 물은 게
 * 아니라 물어서는 안 될 것을 물은 것이다. 분류기는 언제든 틀리므로 틀렸을 때
 * 무엇이 새는지로 경계를 정한다. 환자가 직접 고른 경우에만 연다.
 */
const neverInferred: BodyArea[] = ['womens']

export function inferAreas(selected: BodyArea[], triage: TriageResult): BodyArea[] {
  const picked = selected.filter((area) => area !== 'unsure')
  const top = triage.suggestions[0]
  const guessed = top ? specialtyAreas[top.specialty] : null
  const inferred = guessed !== null && !neverInferred.includes(guessed) ? [guessed] : []

  return [...new Set([...picked, ...inferred])]
}
