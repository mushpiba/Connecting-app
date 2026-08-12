import { weekdayOf } from './clinicHours'
import type { Clinic, ClinicHours, Weekday } from './types'

export interface BookingDay {
  date: string
  weekday: Weekday
  /** 그 요일에 문을 여는가. */
  isOpen: boolean
  /** 지금 잡을 수 있는 시간이 남았는가. 오늘은 이미 지난 시간을 빼고 센다. */
  bookable: boolean
  slots: string[]
}

const SLOT_MINUTES = 30

function toMinutes(time: string): number {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}

function toTime(minutes: number): string {
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function addDays(isoDate: string, days: number): string {
  const base = Date.parse(`${isoDate}T00:00:00.000Z`)
  return new Date(base + days * 86_400_000).toISOString().slice(0, 10)
}

/** '13:00–14:00' 형태를 분 단위 구간으로. 구분자는 대시 종류를 가리지 않는다. */
function breakWindow(lunchBreak: string | null): [number, number] | null {
  if (!lunchBreak) return null
  const match = lunchBreak.match(/(\d{2}:\d{2})\D+(\d{2}:\d{2})/)
  if (!match) return null
  return [toMinutes(match[1]), toMinutes(match[2])]
}

/**
 * 하루치 예약 가능 시간을 만든다. 마감 시각은 진료 시작 시각이 될 수 없어 제외하고,
 * 점심시간에 걸치는 칸도 뺀다.
 */
export function slotsFor(hours: ClinicHours, lunchBreak: string | null): string[] {
  if (hours.open === null || hours.close === null) return []

  const start = toMinutes(hours.open)
  const end = toMinutes(hours.close)
  const lunch = breakWindow(lunchBreak)

  const slots: string[] = []
  for (let at = start; at < end; at += SLOT_MINUTES) {
    if (lunch && at >= lunch[0] && at < lunch[1]) continue
    slots.push(toTime(at))
  }

  return slots
}

/**
 * 기준일부터 dayCount일치 예약 달력. 기준일은 항상 인자다.
 * 휴진일도 빠뜨리지 않고 담는다. 화면에서 왜 못 고르는지 보여야 한다.
 */
/**
 * 오늘부터 며칠치 예약 후보.
 *
 * fromTime 을 주면 오늘 이미 지나간 시간대는 뺀다. 지난 시간을 고를 수 있으면
 * 예약을 끝까지 마치고도 병원에서 연락이 오지 않고, 그때는 무엇이 잘못됐는지
 * 환자가 알 방법이 없다.
 */
export function bookingDays(
  clinic: Clinic,
  fromDate: string,
  dayCount: number,
  fromTime?: string,
): BookingDay[] {
  return Array.from({ length: dayCount }, (_, offset) => {
    const date = addDays(fromDate, offset)
    const weekday = weekdayOf(date)
    const hours = clinic.hours.find((item) => item.weekday === weekday)

    if (!hours || hours.open === null) {
      return { date, weekday, isOpen: false, bookable: false, slots: [] }
    }

    const all = slotsFor(hours, clinic.lunchBreak)
    const slots =
      offset === 0 && fromTime !== undefined ? all.filter((slot) => slot > fromTime) : all

    // 문을 여는 날인 것과 아직 잡을 시간이 남은 것은 다르다. 오늘 진료가 끝난
    // 것을 휴진이라고 적으면 그것도 틀린 말이다.
    return { date, weekday, isOpen: true, bookable: slots.length > 0, slots }
  })
}

/** 예약 화면이 처음 열릴 때 고를 날. 진료하는 가장 빠른 날이다. */
export function firstOpenDay(days: BookingDay[]): BookingDay | null {
  return days.find((day) => day.bookable) ?? null
}
