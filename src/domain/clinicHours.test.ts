import { demoClinics, findClinic } from '../data/demoClinics'
import { clinicScheduleOn, weekFrom, weekdayOf } from './clinicHours'

const han = findClinic('clinic-han')!

describe('weekdayOf', () => {
  it('기준일의 요일을 준다', () => {
    expect(weekdayOf('2026-08-09')).toBe('sun')
    expect(weekdayOf('2026-08-10')).toBe('mon')
    expect(weekdayOf('2026-08-15')).toBe('sat')
  })
})

describe('clinicScheduleOn', () => {
  it('진료일이면 오늘 시간을 준다', () => {
    const schedule = clinicScheduleOn(han, '2026-08-10')

    expect(schedule.isOpenToday).toBe(true)
    expect(schedule.today.open).toBe('09:00')
    expect(schedule.nextOpen).toBeNull()
  })

  it('휴진일이면 다음 진료일을 알려준다', () => {
    const schedule = clinicScheduleOn(han, '2026-08-09')

    expect(schedule.isOpenToday).toBe(false)
    expect(schedule.nextOpen?.weekday).toBe('mon')
  })

  it('토요일 단축 진료를 반영한다', () => {
    const schedule = clinicScheduleOn(han, '2026-08-15')

    expect(schedule.today.close).toBe('13:00')
  })
})

describe('weekFrom', () => {
  it('월요일부터 일요일 순서로 일곱 칸을 준다', () => {
    expect(weekFrom(han).map((item) => item.weekday)).toEqual([
      'mon',
      'tue',
      'wed',
      'thu',
      'fri',
      'sat',
      'sun',
    ])
  })

  it('모든 의료기관이 일주일 표를 채운다', () => {
    demoClinics.forEach((clinic) => {
      expect(weekFrom(clinic)).toHaveLength(7)
    })
  })
})
