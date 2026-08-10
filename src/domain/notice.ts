import type { Clinic, EligibilityResult, ReferralNotice } from './types'

/**
 * 판정이 막혔을 때 환자에게 보낼 안내문과 진료기록에 남길 사유 문구를 만든다.
 * 초안이며 의사가 수정·확정한다.
 */
export function buildReferralNotice(
  result: EligibilityResult,
  clinic: Clinic,
): ReferralNotice {
  const failed = result.checks.filter((item) => item.outcome === 'failed')
  const failedReasons = failed.map((item) => `${item.label}: ${item.detail}`)

  const patientMessage = [
    `${clinic.name} 비대면 진료는 지금 기준으로 어렵습니다.`,
    '',
    '확인된 사유',
    ...failed.map((item) => `· ${item.label} — ${item.detail}`),
    '',
    '대면 진료로 안내드립니다.',
    `${clinic.name} · ${clinic.address} · ${clinic.phone}`,
    '',
    `판정 기준 ${result.ruleSetName} (기준일 ${result.ruleSetAsOf})`,
    '기준은 바뀔 수 있고 최종 판단은 의료진이 합니다.',
  ].join('\n')

  const recordStatement = [
    `비대면 진료 예비 확인 결과 대상 아님으로 판정하여 대면 진료를 안내함.`,
    `사유: ${failed.map((item) => item.label).join(', ') || '해당 없음'}.`,
    `적용 규칙: ${result.ruleSetName} (기준일 ${result.ruleSetAsOf}).`,
    `환자에게 대면 진료 안내 완료.`,
  ].join(' ')

  return {
    patientMessage,
    recordStatement,
    failedReasons,
    ruleSetName: result.ruleSetName,
    ruleSetAsOf: result.ruleSetAsOf,
    evidenceUrl: result.evidenceUrl,
  }
}
