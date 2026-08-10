import type {
  CheckOutcome,
  ClinicSnapshot,
  EligibilityCheck,
  EligibilityContext,
  EligibilityResult,
  EligibilityRuleSet,
  EligibilityStatus,
  PriorVisit,
} from './types'

const HOSPITAL_ONLY_EXCEPTIONS = [
  'rare-disease',
  'type1-diabetes',
  'post-op-followup',
  'correctional-facility',
] as const

function monthsBetween(from: string, to: string): number {
  const start = new Date(from)
  const end = new Date(to)
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  return end.getDate() < start.getDate() ? months - 1 : months
}

function check(
  id: string,
  label: string,
  outcome: CheckOutcome,
  detail: string,
): EligibilityCheck {
  return { id, label, outcome, detail }
}

/**
 * 사용 가능한 재진 기록이 아닌 이유를 문장으로 만든다.
 * 기록 없음·기간 초과·다른 기관을 구분해 왜 초진으로 봤는지 남긴다.
 */
function firstVisitReason(
  priorVisit: PriorVisit | null,
  clinic: ClinicSnapshot,
  revisitValidMonths: number,
): string {
  if (priorVisit === null) {
    return `밝히신 진료 기록이 없어 초진 경로로 봅니다.`
  }
  if (priorVisit.clinicId !== clinic.id) {
    return `다른 의료기관에서 받은 진료라 ${clinic.name} 재진으로는 인정되지 않습니다. 초진 경로로 봅니다.`
  }
  return `${priorVisit.visitedOn} 진료는 재진 인정기간 ${revisitValidMonths}개월을 지났습니다. 초진 경로로 봅니다.`
}

/**
 * 비대면 진료 대상 여부를 예비 확인한다. 최종 판단은 의사가 한다.
 *
 * 두 경로가 있다. 같은 의료기관의 동일 증상 재진 기록이 있으면 재진 경로,
 * 없으면 지역 또는 질환 예외로만 열리는 초진 경로다.
 *
 * revisit-record는 경로를 고르는 체크지 막는 체크가 아니다. 기록이 없다는 것은
 * "초진이다"라는 사실이지 결격 사유가 아니므로 절대 failed를 내지 않는다.
 * 초진 경로의 차단은 first-visit-region이 맡는다.
 */
export function checkEligibility(
  context: EligibilityContext,
  ruleSet: EligibilityRuleSet,
): EligibilityResult {
  const { params } = ruleSet
  const { clinic, priorVisit } = context

  const hasUsableRevisit =
    priorVisit !== null &&
    priorVisit.clinicId === clinic.id &&
    monthsBetween(priorVisit.visitedOn, context.today) < params.revisitValidMonths

  const isFirstVisit = !hasUsableRevisit
  const hasException = HOSPITAL_ONLY_EXCEPTIONS.includes(
    context.exception as (typeof HOSPITAL_ONLY_EXCEPTIONS)[number],
  )

  const checks: EligibilityCheck[] = []

  checks.push(
    check(
      'identity',
      '본인 확인',
      context.identityVerified ? 'passed' : 'failed',
      context.identityVerified
        ? '본인 확인 절차를 마쳤습니다.'
        : '비대면 진료 전에 본인 확인이 필요합니다.',
    ),
  )

  checks.push(
    check(
      'clinic-telemedicine',
      '의료기관 비대면 진료 운영',
      clinic.telemedicineEnabled ? 'passed' : 'failed',
      clinic.telemedicineEnabled
        ? `${clinic.name}은(는) 비대면 진료를 운영하고 있습니다.`
        : `${clinic.name}은(는) 현재 비대면 진료를 운영하지 않습니다.`,
    ),
  )

  if (clinic.level === 'hospital') {
    checks.push(
      check(
        'clinic-level',
        '병원급 예외 사유',
        hasException ? 'passed' : 'failed',
        hasException
          ? '병원급에서 허용되는 예외 사유에 해당합니다.'
          : '병원급은 희귀질환, 1형 당뇨, 수술 후 경과관찰, 교정시설 등 예외에만 해당합니다.',
      ),
    )
  } else {
    checks.push(
      check('clinic-level', '의료기관 종별', 'passed', '의원급은 별도 종별 제한을 받지 않습니다.'),
    )
  }

  checks.push(
    check(
      'revisit-record',
      '동일 의료기관 진료 기록',
      hasUsableRevisit ? 'passed' : 'not-applicable',
      hasUsableRevisit
        ? `${priorVisit!.visitedOn}에 ${clinic.name}에서 진료받은 기록을 환자가 밝혔습니다. 의료진 확인이 필요합니다.`
        : firstVisitReason(priorVisit, clinic, params.revisitValidMonths),
    ),
  )

  if (hasUsableRevisit) {
    checks.push(
      check(
        'same-symptoms',
        '이전과 동일한 증상',
        context.sameSymptoms ? 'passed' : 'failed',
        context.sameSymptoms
          ? '이전 진료와 같은 증상으로 이어지는 진료입니다.'
          : '이전 진료와 다른 새 증상은 대면 진료가 필요합니다.',
      ),
    )
  } else {
    checks.push(
      check(
        'same-symptoms',
        '이전과 동일한 증상',
        'not-applicable',
        '초진 경로에서는 동일 증상 요건을 적용하지 않습니다.',
      ),
    )
  }

  if (isFirstVisit) {
    const sameRegion = context.patientRegion === clinic.region
    const regionSatisfied = !params.requireSameRegionForFirstVisit || sameRegion || hasException
    checks.push(
      check(
        'first-visit-region',
        '초진 지역 요건',
        regionSatisfied ? 'passed' : 'failed',
        hasException
          ? '질환 예외에 해당해 지역 요건을 적용하지 않습니다.'
          : sameRegion
            ? `환자 거주지와 의료기관이 모두 ${clinic.region}입니다.`
            : `초진은 같은 지역에서만 가능합니다. 환자 ${context.patientRegion}, 의료기관 ${clinic.region}.`,
      ),
    )
  } else {
    checks.push(
      check(
        'first-visit-region',
        '초진 지역 요건',
        'not-applicable',
        '재진 경로에서는 지역 요건을 적용하지 않습니다.',
      ),
    )
  }

  const ratioWithinCap = clinic.monthlyTelemedicineRatio <= params.monthlyClinicRatioCap
  checks.push(
    check(
      'clinic-monthly-ratio',
      '의료기관 월 비대면 비율',
      ratioWithinCap ? 'passed' : 'failed',
      `이번 달 ${Math.round(clinic.monthlyTelemedicineRatio * 100)}% · 상한 ${Math.round(
        params.monthlyClinicRatioCap * 100,
      )}%`,
    ),
  )

  const withinPatientCap =
    context.patientMonthlyTelemedicineCount < params.monthlyVisitCapPerPatient
  checks.push(
    check(
      'patient-monthly-cap',
      '환자 월 비대면 횟수',
      withinPatientCap ? 'passed' : 'failed',
      `이번 달 ${context.patientMonthlyTelemedicineCount}회 · 상한 ${params.monthlyVisitCapPerPatient}회`,
    ),
  )

  const failedCheckIds = checks.filter((item) => item.outcome === 'failed').map((item) => item.id)

  let status: EligibilityStatus
  let summary: string

  if (failedCheckIds.length > 0) {
    status = 'ineligible'
    summary = '현재 기준으로는 비대면 진료 대상이 아닙니다. 대면 진료 안내를 확인하세요.'
  } else if (isFirstVisit) {
    status = 'conditional'
    summary = `초진 경로로 예약할 수 있습니다. 처방일수는 최대 ${params.firstVisitMaxPrescriptionDays}일로 제한됩니다.`
  } else {
    status = 'eligible'
    summary = '재진 경로로 비대면 진료를 예약할 수 있습니다.'
  }

  return {
    status,
    summary,
    checks,
    failedCheckIds,
    isFirstVisit,
    ruleSetName: ruleSet.name,
    ruleSetAsOf: ruleSet.asOf,
    evidenceUrl: ruleSet.evidenceUrl,
  }
}
