import { checkEligibility } from './eligibility'
import type {
  Clinic,
  ClinicSnapshot,
  EligibilityRuleSet,
  Question,
  TelemedicineGate,
  TelemedicinePrecheck,
} from './types'

export function isPrecheckComplete(precheck: TelemedicinePrecheck): boolean {
  return precheck.completedAt !== null && precheck.agreedToTerms && precheck.identityVerified
}

function toSnapshot(clinic: Clinic): ClinicSnapshot {
  return {
    id: clinic.id,
    name: clinic.name,
    level: clinic.level,
    region: clinic.region,
    telemedicineEnabled: clinic.telemedicineEnabled,
    monthlyTelemedicineRatio: clinic.monthlyTelemedicineRatio,
  }
}

/**
 * 비대면 진료 신청 버튼의 활성 여부와 막힌 사유를 정한다.
 *
 * 버튼은 화면에서 항상 렌더된다. 조건을 못 채우면 사라지는 게 아니라 비활성으로
 * 남고 왜 안 되는지 보여준다. 사유는 첫 번째 실패 체크의 detail을 그대로 쓴다.
 * checks 순서가 본인확인 → 의료기관 → 경로 요건 → 상한이라 우선순위가 맞다.
 */
export function evaluateTelemedicineGate(
  precheck: TelemedicinePrecheck,
  question: Question,
  clinic: Clinic,
  ruleSet: EligibilityRuleSet,
  today: string,
): TelemedicineGate {
  if (!isPrecheckComplete(precheck)) {
    return {
      enabled: false,
      reason: '비대면 사전 확인을 먼저 마쳐 주세요.',
      result: null,
    }
  }

  const result = checkEligibility(
    {
      identityVerified: precheck.identityVerified,
      priorVisit: question.priorVisit,
      sameSymptoms: question.sameSymptoms,
      patientRegion: precheck.region,
      patientMonthlyTelemedicineCount: precheck.monthlyTelemedicineCount,
      exception: precheck.exception,
      clinic: toSnapshot(clinic),
      today,
    },
    ruleSet,
  )

  if (result.failedCheckIds.length > 0) {
    const first = result.checks.find((item) => item.id === result.failedCheckIds[0])
    return { enabled: false, reason: first?.detail ?? result.summary, result }
  }

  return { enabled: true, reason: '', result }
}
