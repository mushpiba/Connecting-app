import { describe, expect, it } from 'vitest'
import { eligibilityRuleSet } from '../data/rules/eligibilityRules'
import { checkEligibility } from './eligibility'
import type { ClinicSnapshot, EligibilityContext } from './types'

const clinic: ClinicSnapshot = {
  id: 'clinic-han',
  name: '한빛이비인후과의원',
  level: 'clinic',
  region: '인천 미추홀구',
  telemedicineEnabled: true,
  monthlyTelemedicineRatio: 0.18,
}

function context(overrides: Partial<EligibilityContext> = {}): EligibilityContext {
  return {
    identityVerified: true,
    priorVisit: { clinicId: 'clinic-han', visitedOn: '2026-06-02', selfReported: true },
    sameSymptoms: true,
    patientRegion: '인천 미추홀구',
    patientMonthlyTelemedicineCount: 0,
    exception: 'none',
    clinic,
    today: '2026-08-09',
    ...overrides,
  }
}

function outcomeOf(result: ReturnType<typeof checkEligibility>, id: string) {
  return result.checks.find((item) => item.id === id)?.outcome
}

describe('checkEligibility', () => {
  it('인정기간 내 동일 의료기관 동일 증상이면 재진으로 통과시킨다', () => {
    const result = checkEligibility(context(), eligibilityRuleSet)

    expect(result.status).toBe('eligible')
    expect(result.isFirstVisit).toBe(false)
    expect(result.failedCheckIds).toEqual([])
  })

  it('같은 지역 초진은 조건부로 열어준다', () => {
    const result = checkEligibility(context({ priorVisit: null }), eligibilityRuleSet)

    expect(result.status).toBe('conditional')
    expect(result.isFirstVisit).toBe(true)
    expect(result.summary).toContain('7일')
  })

  it('다른 지역 초진은 막는다', () => {
    const result = checkEligibility(
      context({ priorVisit: null, patientRegion: '서울 강남구' }),
      eligibilityRuleSet,
    )

    expect(result.status).toBe('ineligible')
    expect(result.failedCheckIds).toContain('first-visit-region')
  })

  it('질환 예외가 있으면 다른 지역 초진도 지역 요건을 면제한다', () => {
    const result = checkEligibility(
      context({ priorVisit: null, patientRegion: '서울 강남구', exception: 'rare-disease' }),
      eligibilityRuleSet,
    )

    expect(outcomeOf(result, 'first-visit-region')).toBe('passed')
    expect(result.status).toBe('conditional')
  })

  it('인정기간을 넘긴 진료 기록은 초진으로 본다', () => {
    const result = checkEligibility(
      context({ priorVisit: { clinicId: 'clinic-han', visitedOn: '2025-11-01', selfReported: true } }),
      eligibilityRuleSet,
    )

    expect(result.isFirstVisit).toBe(true)
    expect(outcomeOf(result, 'revisit-record')).toBe('failed')
  })

  it('다른 의료기관 진료 기록은 재진으로 인정하지 않는다', () => {
    const result = checkEligibility(
      context({ priorVisit: { clinicId: 'clinic-other', visitedOn: '2026-07-20', selfReported: true } }),
      eligibilityRuleSet,
    )

    expect(result.isFirstVisit).toBe(true)
  })

  it('재진인데 증상이 다르면 막는다', () => {
    const result = checkEligibility(context({ sameSymptoms: false }), eligibilityRuleSet)

    expect(result.status).toBe('ineligible')
    expect(result.failedCheckIds).toContain('same-symptoms')
  })

  it('초진 경로에서는 동일 증상 요건을 적용하지 않는다', () => {
    const result = checkEligibility(
      context({ priorVisit: null, sameSymptoms: false }),
      eligibilityRuleSet,
    )

    expect(outcomeOf(result, 'same-symptoms')).toBe('not-applicable')
    expect(result.failedCheckIds).not.toContain('same-symptoms')
  })

  it('본인 확인이 안 됐으면 막는다', () => {
    const result = checkEligibility(context({ identityVerified: false }), eligibilityRuleSet)

    expect(result.failedCheckIds).toContain('identity')
  })

  it('비대면을 운영하지 않는 의료기관이면 막는다', () => {
    const result = checkEligibility(
      context({ clinic: { ...clinic, telemedicineEnabled: false } }),
      eligibilityRuleSet,
    )

    expect(result.failedCheckIds).toContain('clinic-telemedicine')
  })

  it('의료기관 월 비대면 비율이 상한을 넘으면 막는다', () => {
    const result = checkEligibility(
      context({ clinic: { ...clinic, monthlyTelemedicineRatio: 0.34 } }),
      eligibilityRuleSet,
    )

    expect(result.failedCheckIds).toContain('clinic-monthly-ratio')
  })

  it('환자 월 비대면 횟수가 상한에 닿으면 막는다', () => {
    const result = checkEligibility(
      context({ patientMonthlyTelemedicineCount: 2 }),
      eligibilityRuleSet,
    )

    expect(result.failedCheckIds).toContain('patient-monthly-cap')
  })

  it('병원급은 예외 사유가 없으면 막는다', () => {
    const result = checkEligibility(
      context({ clinic: { ...clinic, level: 'hospital' } }),
      eligibilityRuleSet,
    )

    expect(result.failedCheckIds).toContain('clinic-level')
  })

  it('병원급도 예외 사유가 있으면 종별 요건을 통과한다', () => {
    const result = checkEligibility(
      context({ clinic: { ...clinic, level: 'hospital' }, exception: 'type1-diabetes' }),
      eligibilityRuleSet,
    )

    expect(outcomeOf(result, 'clinic-level')).toBe('passed')
  })

  it('판정 근거로 규칙셋 이름과 기준일을 남긴다', () => {
    const result = checkEligibility(context(), eligibilityRuleSet)

    expect(result.ruleSetName).toBe(eligibilityRuleSet.name)
    expect(result.ruleSetAsOf).toBe(eligibilityRuleSet.asOf)
    expect(result.evidenceUrl).toBe(eligibilityRuleSet.evidenceUrl)
  })
})
