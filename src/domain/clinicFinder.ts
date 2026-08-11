import { clinicScheduleOn } from './clinicHours'
import type { Clinic, EligibilityRuleSet, Weekday } from './types'

export type FirstVisitTelemedicine = 'allowed' | 'blocked'

export interface NearbyClinic {
  clinic: Clinic
  sameRegion: boolean
  telemedicineEnabled: boolean
  /** 초진 비대면이 열리는지. 재진은 지역 제한을 받지 않으므로 여기서 다루지 않는다. */
  firstVisitTelemedicine: FirstVisitTelemedicine
  blockedReason: string
  openToday: boolean
  todayLabel: string
  weekday: Weekday
}

/**
 * 내 지역을 기준으로 의료기관을 훑는다.
 *
 * 지도에서 "비대면 가능"만 보여주면 환자가 초진에서 막히는 이유를 모른다.
 * 의료기관이 비대면을 운영하는가와, 초진 지역 요건을 통과하는가는 다른 조건이라
 * 둘을 나눠서 돌려준다. 판정 근거는 규칙셋에서만 온다.
 */
export function findNearbyClinics(
  clinics: Clinic[],
  patientRegion: string,
  ruleSet: EligibilityRuleSet,
  today: string,
): NearbyClinic[] {
  return clinics
    .map((clinic) => {
      const sameRegion = clinic.region === patientRegion
      const schedule = clinicScheduleOn(clinic, today)

      let firstVisitTelemedicine: FirstVisitTelemedicine = 'allowed'
      let blockedReason = ''

      if (!clinic.telemedicineEnabled) {
        firstVisitTelemedicine = 'blocked'
        blockedReason = '비대면 진료를 운영하지 않는 의료기관입니다.'
      } else if (clinic.level === 'hospital') {
        firstVisitTelemedicine = 'blocked'
        blockedReason = '병원급은 희귀질환 등 예외 사유에만 비대면이 열립니다.'
      } else if (ruleSet.params.requireSameRegionForFirstVisit && !sameRegion) {
        firstVisitTelemedicine = 'blocked'
        blockedReason = `초진 비대면은 같은 지역만 가능합니다. 내 지역 ${patientRegion}, 의료기관 ${clinic.region}.`
      } else if (clinic.monthlyTelemedicineRatio > ruleSet.params.monthlyClinicRatioCap) {
        firstVisitTelemedicine = 'blocked'
        blockedReason = '이번 달 비대면 진료 비율 상한을 넘겨 접수가 어렵습니다.'
      }

      return {
        clinic,
        sameRegion,
        telemedicineEnabled: clinic.telemedicineEnabled,
        firstVisitTelemedicine,
        blockedReason,
        openToday: schedule.isOpenToday,
        todayLabel: schedule.isOpenToday
          ? `오늘 ${schedule.today.open}–${schedule.today.close}`
          : '오늘 휴진',
        weekday: schedule.weekday,
      }
    })
    .sort(
      (a, b) =>
        Number(b.sameRegion) - Number(a.sameRegion) ||
        Number(b.firstVisitTelemedicine === 'allowed') -
          Number(a.firstVisitTelemedicine === 'allowed') ||
        a.clinic.name.localeCompare(b.clinic.name),
    )
}
