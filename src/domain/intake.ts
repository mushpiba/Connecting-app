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
 * 환자가 부위 체크를 건너뛰어도 적은 내용에서 범주를 잡아 그 범주의 문항을
 * 연다. 고른 부위가 있으면 그것과 합친다. 넓게 잡아 질문이 늘어나는 쪽이
 * 좁게 잡아 물어야 할 것을 놓치는 쪽보다 낫다.
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

export function inferAreas(selected: BodyArea[], triage: TriageResult): BodyArea[] {
  const inferred = triage.suggestions.map((item) => specialtyAreas[item.specialty])
  return [...new Set([...selected.filter((area) => area !== 'unsure'), ...inferred])]
}
