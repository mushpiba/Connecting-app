import { weekdayOf } from './clinicHours'
import type { Clinic, ClinicHours, Weekday } from './types'

export interface BookingDay {
  date: string
  weekday: Weekday
  isOpen: boolean
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
export function bookingDays(clinic: Clinic, fromDate: string, dayCount: number): BookingDay[] {
  return Array.from({ length: dayCount }, (_, offset) => {
    const date = addDays(fromDate, offset)
    const weekday = weekdayOf(date)
    const hours = clinic.hours.find((item) => item.weekday === weekday)

    if (!hours || hours.open === null) {
      return { date, weekday, isOpen: false, slots: [] }
    }

    return { date, weekday, isOpen: true, slots: slotsFor(hours, clinic.lunchBreak) }
  })
}

/** 예약 화면이 처음 열릴 때 고를 날. 진료하는 가장 빠른 날이다. */
export function firstOpenDay(days: BookingDay[]): BookingDay | null {
  return days.find((day) => day.isOpen) ?? null
}
