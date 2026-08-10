import type { IntakeForm, IntakeRuleSet } from './types'

/**
 * 문진 양식을 진료과 분류에 넣을 한 덩어리 문장으로 만든다.
 *
 * 자유 텍스트는 그대로 쓰고, 체크한 부위만 키워드로 펼쳐 뒤에 붙인다.
 * 펼친 토큰은 분류에만 쓰고 게시글 본문에는 넣지 않는다. matchDoctors는
 * 환자가 실제로 쓴 문장만 보므로 의사 키워드 매칭이 부풀지 않는다.
 */
export function buildTriageText(form: IntakeForm, ruleSet: IntakeRuleSet): string {
  const expansions = form.bodyAreas.flatMap((area) => ruleSet.areaKeywords[area] ?? [])

  return [form.title, form.body, ...expansions].join(' ').replace(/\s+/g, ' ').trim()
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
