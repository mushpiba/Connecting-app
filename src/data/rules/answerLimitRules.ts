import type { AnswerLimitRuleSet } from '../../domain/types'

/**
 * 의사 하루 공개 답변 상한. D-8에서 닫혔다.
 *
 * 5라는 값에 근거는 없다. 「진료 사이 빈 시간에 소화 가능한 양」이라는 감각적
 * 출발점이며 H-3으로 재고 조정한다. 그래서 판정 코드가 아니라 여기에 둔다 —
 * 값이 바뀔 때 고치는 파일이 하나여야 한다 (원칙 7).
 *
 * 상한은 감추는 제약이 아니라 드러내는 자원이다. 목적의 우선순위는
 * ① 답변 품질 ② 희소성으로 참여 유도 ③ 도배 방지이고, ③은 특정 의원의
 * 도배식 노출을 막아 광고성 부인 논거가 된다 (C-2 파생 4). 없애지 않는다.
 */
export const answerLimitRuleSet: AnswerLimitRuleSet = {
  name: '의사 하루 답변 상한',
  asOf: '2026-08-27',
  dailyLimit: 5,
  resetHourKst: 0,
}
