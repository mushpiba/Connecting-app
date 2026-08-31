import type {
  AppRole,
  ExpressionFilterHit,
  FilterSurface,
  PrivateMessage,
  PrivateThread,
  PrivateThreadRuleSet,
} from './types'

/**
 * 의사 회신 말풍선이 스스로 달고 나가는 고지. **의사가 지울 수 없다** (D-6 항목 4).
 *
 * 입력 칸에 미리 채워 두지 않는 이유가 여기 있다 — 채워 두면 지울 수 있게 되고
 * 그러면 「못 지운다」가 거짓이 된다. 그리고 길이 상한에 세지 않는다: 지울 수
 * 없는 글이 의사의 글자 수를 먹으면 고지를 짧게 만들자는 압력이 생긴다.
 */
export const PRIVATE_REPLY_STANDING_NOTICE =
  '이 글은 진료가 아니며 진단·처방이 아닙니다. 증상이 달라지거나 심해지면 진료를 받으세요.'

/** 걸린 기록에 남기는 조각의 길이. 표의 check 제약과 같은 값이다. */
const MATCHED_SPAN_MAX = 20

export interface ExpressionHit {
  ruleId: string
  /** 걸린 조각. 20자를 넘기지 않는다 — 화면과 로그가 같은 값을 쓴다. */
  span: string
  /** 본문에서의 시작 위치. 화면이 「그 자리」에 표시할 때 쓴다. */
  index: number
  /** 무엇을 고쳐야 하는지 알려 주는 글. 뭉뚱그리지 않는다. */
  message: string
}

/**
 * 처방·진단 단정·검사 지시·의료기관 유치로 읽히는 표현을 찾는다 (G-8 · PT-1~PT-5).
 *
 * **적용 대상은 의사가 쓰는 글이다.** 환자 발화는 걸지 않는다 — 환자가 자기가
 * 먹는 약 이름을 적는 것을 막으면 문진이 무너지고, 애초에 처방·진단의 주체가
 * 아니다 (§Q-5 §3).
 *
 * ⚠️ **R-6 · 이 판정은 브라우저에서 돈다. 아직 열려 있다.** 화면이 막아도 API를
 * 직접 부르면 금지 표현이 그대로 저장되고 걸린 기록도 남지 않는다. 순서와 방향은
 * `private_messages` RLS가 막지만 **횟수·길이·표현은 여기서만 판정한다.**
 * 의도한 나눔이다 — 이 값들은 유권해석이 오면 움직이고, `check` 제약으로 걸면
 * 값이 바뀔 때마다 마이그레이션이 필요해진다(D-6이 못 박은 것과 어긋난다).
 * **서버가 같은 규칙 파일을 읽고 한 번 더 판정하는 것은 M3다**(`50-nonfunctional.md` R-6).
 * 그 사이에 실제 환자를 태우지 않는다 — 그것이 M3가 있는 이유다.
 */
export function findExpressionHits(
  body: string,
  rules: PrivateThreadRuleSet,
): ExpressionHit[] {
  const hits: ExpressionHit[] = []
  const seen = new Set<string>()

  for (const rule of rules.bannedPatterns) {
    // 빈 원문은 모든 자리에 붙는다. 규칙 파일이 목록을 못 만들었을 때 화면이
    // 전부 막히는 쪽으로 실패하면 원인을 찾을 수 없다.
    if (!rule.source) continue

    const pattern = new RegExp(rule.source, 'gi')
    let match = pattern.exec(body)
    while (match !== null) {
      const span = match[0].slice(0, MATCHED_SPAN_MAX)
      const key = `${rule.id}:${span}`
      if (!seen.has(key)) {
        seen.add(key)
        hits.push({ ruleId: rule.id, span, index: match.index, message: rule.message.replace('{}', span) })
      }
      // 길이 0 매치는 자리를 못 옮겨 무한 반복이 된다.
      if (match.index === pattern.lastIndex) pattern.lastIndex += 1
      match = pattern.exec(body)
    }
  }

  return hits.sort((left, right) => left.index - right.index)
}

/**
 * 걸린 사실을 남길 기록을 만든다.
 *
 * **본문을 담지 않는다.** 필요한 것은 우리가 걸렀다는 사실이지 환자의 증상
 * 원문이 아니다 — 막으려고 만든 장치가 새 민감정보 보관소가 되면 안 된다.
 * 앞뒤 문맥도, 그 뒤 무엇으로 고쳐 보냈는지도 남기지 않는다.
 *
 * `ruleSetAsOf`는 규칙 파라미터가 아니라 **지나간 사실**이다. 규칙 파일이 바뀌어도
 * 이 값은 바뀌지 않아야 감사에 쓸 수 있다 — 방향이 반대다.
 */
export function toFilterHitRecords(
  hits: ExpressionHit[],
  authorId: string,
  surface: FilterSurface,
  target: { questionId?: string; threadId?: string },
  rules: PrivateThreadRuleSet,
  now: string,
): Omit<ExpressionFilterHit, 'id'>[] {
  return hits.map((hit) => ({
    authorId,
    surface,
    questionId: target.questionId ?? null,
    threadId: target.threadId ?? null,
    ruleId: hit.ruleId,
    ruleSetAsOf: rules.asOf,
    matchedSpan: hit.span,
    createdAt: now,
  }))
}

export interface PrivateThreadStage {
  patientSaid: number
  doctorSaid: number
  /** 환자가 아직 물을 수 있는 횟수. 열자마자 `maxRounds` 다. */
  roundsLeft: number
  /** 지금 말할 수 있는 쪽. 상한을 다 썼으면 아무도 아니다. */
  turn: AppRole | null
  /**
   * 상한 소진. **차단이 아니라 완결이다** — 「상한을 다 쓰면 그 자체가 닫힘」이라
   * 만료 기간을 따로 두지 않았다 (§Q-5 §6).
   */
  exhausted: boolean
}

/**
 * 한 대화가 지금 어디까지 왔나.
 *
 * 한 왕복 = 환자 1 + 의사 1. 환자가 먼저 열고 마지막 발화권도 의사에게 간다.
 * 순서와 방향은 `private_messages`의 두 INSERT 정책이 서버에서도 같은 모양으로
 * 막는다 — 여기서 세는 것은 **숫자**뿐이고, 그 숫자만 규칙 파일에 있다.
 *
 * ⚠️ **R-6이 이 함수에도 걸린다.** 위 `findExpressionHits`의 주석과 같은 자리다.
 */
export function privateThreadStage(
  messages: PrivateMessage[],
  rules: PrivateThreadRuleSet,
): PrivateThreadStage {
  const patientSaid = messages.filter((message) => message.senderRole === 'patient').length
  const doctorSaid = messages.filter((message) => message.senderRole === 'doctor').length
  const { maxRounds } = rules.limits

  const doctorTurn = doctorSaid < patientSaid
  const patientTurn = patientSaid === doctorSaid && patientSaid < maxRounds

  return {
    patientSaid,
    doctorSaid,
    roundsLeft: Math.max(0, maxRounds - patientSaid),
    turn: doctorTurn ? 'doctor' : patientTurn ? 'patient' : null,
    exhausted: patientSaid >= maxRounds && doctorSaid >= maxRounds,
  }
}

/** 한 번에 쓸 수 있는 글자 수. 의사 쪽이 짧은 것은 의도한 비대칭이다. */
export function maxCharsFor(role: AppRole, rules: PrivateThreadRuleSet): number {
  return role === 'doctor' ? rules.limits.doctorMaxChars : rules.limits.patientMaxChars
}

export interface AwaitingReply {
  thread: PrivateThread
  /** 환자가 마지막으로 물은 시각. 오래 기다린 것부터 세운다. */
  waitingSince: string
}

/**
 * 의사에게 「내 회신 차례인 대화」. Q-9의 한 줄이 세는 것이다.
 *
 * **환자가 이미 연 대화만 들어온다.** 이 목록을 「말 걸 수 있는 환자 목록」으로
 * 자라게 하지 않는다 — 그 순간 의사 쪽 영업 경로가 되고 D-6 항목 1이 구조에서
 * 문구로 내려앉는다. 상한을 다 쓴 대화는 세지 않는다.
 */
export function awaitingDoctorReply(
  threads: PrivateThread[],
  messages: PrivateMessage[],
  doctorId: string,
  rules: PrivateThreadRuleSet,
): AwaitingReply[] {
  return threads
    .filter((thread) => thread.doctorId === doctorId)
    .flatMap((thread) => {
      const own = messagesOf(messages, thread.id)
      if (privateThreadStage(own, rules).turn !== 'doctor') return []
      const lastPatient = own.filter((message) => message.senderRole === 'patient').at(-1)
      return lastPatient ? [{ thread, waitingSince: lastPatient.createdAt }] : []
    })
    .sort((left, right) => left.waitingSince.localeCompare(right.waitingSince))
}

/** 한 대화의 말풍선을 시간순으로. 화면과 카운트가 같은 순서를 쓴다. */
export function messagesOf(messages: PrivateMessage[], threadId: string): PrivateMessage[] {
  return messages
    .filter((message) => message.threadId === threadId)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
}

/** 이 답변 카드 아래에 열린 대화. 한 답변에 하나다. */
export function threadForAnswer(
  threads: PrivateThread[],
  answerId: string,
  patientId: string,
): PrivateThread | null {
  return (
    threads.find((thread) => thread.answerId === answerId && thread.patientId === patientId) ?? null
  )
}
