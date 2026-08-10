import type { Clinic, ClinicHours, ClinicSchedule, Weekday } from './types'

const ORDER: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export const weekdayLabels: Record<Weekday, string> = {
  sun: '일',
  mon: '월',
  tue: '화',
  wed: '수',
  thu: '목',
  fri: '금',
  sat: '토',
}

/** 기준일의 요일. 기준일은 항상 인자다. */
export function weekdayOf(isoDate: string): Weekday {
  return ORDER[new Date(`${isoDate}T00:00:00.000Z`).getUTCDay()]
}

function hoursFor(clinic: Clinic, weekday: Weekday): ClinicHours {
  return (
    clinic.hours.find((item) => item.weekday === weekday) ?? {
      weekday,
      open: null,
      close: null,
    }
  )
}

/**
 * 오늘 진료하는지, 아니면 다음 진료일이 언제인지 정한다.
 * 휴진일에 예약 버튼만 덩그러니 두면 환자가 헛걸음한다.
 */
export function clinicScheduleOn(clinic: Clinic, today: string): ClinicSchedule {
  const weekday = weekdayOf(today)
  const todayHours = hoursFor(clinic, weekday)
  const isOpenToday = todayHours.open !== null

  if (isOpenToday) {
    return { weekday, today: todayHours, isOpenToday, nextOpen: null }
  }

  const start = ORDER.indexOf(weekday)
  for (let step = 1; step <= 7; step += 1) {
    const candidate = hoursFor(clinic, ORDER[(start + step) % 7])
    if (candidate.open !== null) {
      return { weekday, today: todayHours, isOpenToday, nextOpen: candidate }
    }
  }

  return { weekday, today: todayHours, isOpenToday, nextOpen: null }
}

/** 주간 표를 월요일부터 보여주기 위한 순서. */
export function weekFrom(clinic: Clinic): ClinicHours[] {
  const weekOrder: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  return weekOrder.map((weekday) => hoursFor(clinic, weekday))
}
