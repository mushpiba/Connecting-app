import { describe, expect, it } from 'vitest'
import { eligibilityRuleSet } from '../data/rules/eligibilityRules'
import { checkEligibility } from './eligibility'
import { buildReferralNotice } from './notice'
import type { Clinic, EligibilityContext } from './types'

const clinic: Clinic = {
  id: 'clinic-han',
  name: '한빛이비인후과의원',
  level: 'clinic',
  region: '인천 미추홀구',
  address: '인천 미추홀구 인하로 100',
  phone: '032-000-0000',
  bookingUrl: 'https://example.com/booking/han',
  telemedicineEnabled: true,
  monthlyTelemedicineRatio: 0.18,
}

const blocked: EligibilityContext = {
  identityVerified: true,
  priorVisit: null,
  sameSymptoms: false,
  patientRegion: '서울 강남구',
  patientMonthlyTelemedicineCount: 0,
  exception: 'none',
  clinic: {
    id: clinic.id,
    name: clinic.name,
    level: clinic.level,
    region: clinic.region,
    telemedicineEnabled: clinic.telemedicineEnabled,
    monthlyTelemedicineRatio: clinic.monthlyTelemedicineRatio,
  },
  today: '2026-08-09',
}

describe('buildReferralNotice', () => {
  it('막힌 요건을 환자 안내문에 그대로 적는다', () => {
    const result = checkEligibility(blocked, eligibilityRuleSet)
    const notice = buildReferralNotice(result, clinic)

    expect(notice.failedReasons.length).toBeGreaterThan(0)
    expect(notice.patientMessage).toContain('초진 지역 요건')
  })

  it('환자 안내문에 대면 진료 연락처를 넣는다', () => {
    const notice = buildReferralNotice(checkEligibility(blocked, eligibilityRuleSet), clinic)

    expect(notice.patientMessage).toContain(clinic.address)
    expect(notice.patientMessage).toContain(clinic.phone)
  })

  it('기준일과 규칙셋 이름을 안내문과 기록 문구 양쪽에 남긴다', () => {
    const result = checkEligibility(blocked, eligibilityRuleSet)
    const notice = buildReferralNotice(result, clinic)

    expect(notice.patientMessage).toContain(eligibilityRuleSet.asOf)
    expect(notice.recordStatement).toContain(eligibilityRuleSet.asOf)
    expect(notice.recordStatement).toContain(eligibilityRuleSet.name)
  })

  it('최종 판단이 의료진에게 있음을 환자 안내문에 남긴다', () => {
    const notice = buildReferralNotice(checkEligibility(blocked, eligibilityRuleSet), clinic)

    expect(notice.patientMessage).toContain('최종 판단은 의료진이 합니다')
  })
})
