import type { EligibilityRuleSet } from '../../domain/types'

/**
 * 하위법령(시행령·시행규칙)이 확정되기 전이므로 수치는 전부 파라미터로 둔다.
 * 값이 바뀌면 이 파일만 고치고 판정 코드는 건드리지 않는다.
 */
export const eligibilityRuleSet: EligibilityRuleSet = {
  name: '비대면 진료 대상자 판정 시연 규칙셋',
  source: '의료법 제34조의2~제34조의9(2026-12-24 시행 예정) 및 비대면진료 시범사업 지침(2025-10-27)',
  asOf: '2026-08-09',
  evidenceUrl: 'https://www.law.go.kr/법령/의료법',
  params: {
    revisitValidMonths: 6,
    firstVisitMaxPrescriptionDays: 7,
    monthlyClinicRatioCap: 0.3,
    monthlyVisitCapPerPatient: 2,
    requireSameRegionForFirstVisit: true,
  },
}
