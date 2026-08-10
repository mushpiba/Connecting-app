import { eligibilityRuleSet } from '../data/rules/eligibilityRules'
import { triageRuleSet } from '../data/rules/triageRules'
import { evaluateTelemedicineGate, isPrecheckComplete } from './telemedicine'
import { triage } from './triage'
import type { Clinic, Question, TelemedicinePrecheck } from './types'

const today = '2026-08-09'

const clinic: Clinic = {
  id: 'clinic-han',
  name: '한빛이비인후과의원',
  level: 'clinic',
  region: '인천 미추홀구',
  address: '인천 미추홀구 가상로 12',
  phone: '032-000-0000',
  bookingUrl: 'https://example.invalid/han',
  telemedicineEnabled: true,
  monthlyTelemedicineRatio: 0.18,
}

function precheck(overrides: Partial<TelemedicinePrecheck> = {}): TelemedicinePrecheck {
  return {
    completedAt: '2026-08-09T08:00:00.000Z',
    identityVerified: true,
    region: '인천 미추홀구',
    monthlyTelemedicineCount: 0,
    exception: 'none',
    agreedToTerms: true,
    ...overrides,
  }
}

function question(overrides: Partial<Question> = {}): Question {
  const body = '콧물이랑 코막힘이 2주째 이어집니다.'
  return {
    id: 'q-1',
    patientId: 'pat-1',
    title: '콧물과 코막힘',
    body,
    createdAt: '2026-08-09T09:00:00.000Z',
    triage: triage(body, triageRuleSet),
    priorVisit: { clinicId: 'clinic-han', visitedOn: '2026-06-02', selfReported: true },
    sameSymptoms: true,
    visibility: 'public',
    onsetDate: '2026-07-27',
    course: 'unchanged',
    dailyImpact: 'mild',
    triedRemedies: ['otc'],
    bodyAreas: ['ent'],
    ...overrides,
  }
}

describe('isPrecheckComplete', () => {
  it('사전 확인을 마쳤으면 참이다', () => {
    expect(isPrecheckComplete(precheck())).toBe(true)
  })

  it('동의를 안 했으면 거짓이다', () => {
    expect(isPrecheckComplete(precheck({ agreedToTerms: false }))).toBe(false)
  })

  it('완료 시각이 없으면 거짓이다', () => {
    expect(isPrecheckComplete(precheck({ completedAt: null }))).toBe(false)
  })
})

describe('evaluateTelemedicineGate', () => {
  it('사전 확인 전에는 사유가 사전 확인이다', () => {
    const gate = evaluateTelemedicineGate(
      precheck({ completedAt: null }),
      question(),
      clinic,
      eligibilityRuleSet,
      today,
    )

    expect(gate.enabled).toBe(false)
    expect(gate.reason).toBe('비대면 사전 확인을 먼저 마쳐 주세요.')
    expect(gate.result).toBeNull()
  })

  it('재진이면 열린다', () => {
    const gate = evaluateTelemedicineGate(precheck(), question(), clinic, eligibilityRuleSet, today)

    expect(gate.enabled).toBe(true)
    expect(gate.reason).toBe('')
    expect(gate.result?.status).toBe('eligible')
  })

  it('같은 지역 초진이면 열린다', () => {
    const gate = evaluateTelemedicineGate(
      precheck(),
      question({ priorVisit: null }),
      clinic,
      eligibilityRuleSet,
      today,
    )

    expect(gate.enabled).toBe(true)
    expect(gate.result?.status).toBe('conditional')
  })

  it('다른 지역 초진이면 지역 사유를 그대로 준다', () => {
    const gate = evaluateTelemedicineGate(
      precheck({ region: '서울 강남구' }),
      question({ priorVisit: null }),
      clinic,
      eligibilityRuleSet,
      today,
    )

    expect(gate.enabled).toBe(false)
    expect(gate.reason).toContain('초진은 같은 지역에서만 가능합니다')
  })

  it('비대면을 운영하지 않는 의료기관이면 그 사유를 준다', () => {
    const gate = evaluateTelemedicineGate(
      precheck(),
      question(),
      { ...clinic, telemedicineEnabled: false },
      eligibilityRuleSet,
      today,
    )

    expect(gate.enabled).toBe(false)
    expect(gate.reason).toContain('비대면 진료를 운영하지 않습니다')
  })

  it('재진인데 증상이 다르면 그 사유를 준다', () => {
    const gate = evaluateTelemedicineGate(
      precheck(),
      question({ sameSymptoms: false }),
      clinic,
      eligibilityRuleSet,
      today,
    )

    expect(gate.enabled).toBe(false)
    expect(gate.reason).toContain('새 증상은 대면 진료가 필요합니다')
  })

  it('여러 조건이 막히면 우선순위가 높은 사유를 준다', () => {
    const gate = evaluateTelemedicineGate(
      precheck({ region: '서울 강남구' }),
      question({ priorVisit: null }),
      { ...clinic, telemedicineEnabled: false },
      eligibilityRuleSet,
      today,
    )

    expect(gate.result?.failedCheckIds).toEqual(['clinic-telemedicine', 'first-visit-region'])
    expect(gate.reason).toContain('비대면 진료를 운영하지 않습니다')
  })
})
