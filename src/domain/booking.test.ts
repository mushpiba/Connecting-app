import { findClinic } from '../data/demoClinics'
import { addDays, bookingDays, firstOpenDay, slotsFor } from './booking'

const han = findClinic('clinic-han')!
const skin = findClinic('clinic-skin')!

describe('addDays', () => {
  it('날짜를 더한다', () => {
    expect(addDays('2026-08-09', 1)).toBe('2026-08-10')
  })

  it('월을 넘어간다', () => {
    expect(addDays('2026-08-30', 3)).toBe('2026-09-02')
  })
})

describe('slotsFor', () => {
  it('마감 시각은 예약 칸으로 두지 않는다', () => {
    const slots = slotsFor({ weekday: 'mon', open: '09:00', close: '11:00' }, null)

    expect(slots).toEqual(['09:00', '09:30', '10:00', '10:30'])
  })

  it('점심시간에 걸치는 칸을 뺀다', () => {
    const slots = slotsFor({ weekday: 'mon', open: '12:30', close: '15:00' }, '13:00–14:00')

    expect(slots).toEqual(['12:30', '14:00', '14:30'])
  })

  it('휴진이면 빈 배열을 준다', () => {
    expect(slotsFor({ weekday: 'sun', open: null, close: null }, '13:00–14:00')).toEqual([])
  })
})

describe('bookingDays', () => {
  it('기준일부터 요청한 날 수만큼 만든다', () => {
    const days = bookingDays(han, '2026-08-09', 7)

    expect(days).toHaveLength(7)
    expect(days[0].date).toBe('2026-08-09')
    expect(days[6].date).toBe('2026-08-15')
  })

  it('휴진일도 빠뜨리지 않고 담는다', () => {
    const days = bookingDays(han, '2026-08-09', 7)

    expect(days[0].weekday).toBe('sun')
    expect(days[0].isOpen).toBe(false)
    expect(days[0].slots).toEqual([])
  })

  it('평일은 점심시간을 뺀 칸을 준다', () => {
    const monday = bookingDays(han, '2026-08-09', 7)[1]

    expect(monday.isOpen).toBe(true)
    expect(monday.slots[0]).toBe('09:00')
    expect(monday.slots.at(-1)).toBe('18:00')
    expect(monday.slots).not.toContain('13:00')
    expect(monday.slots).not.toContain('13:30')
  })

  it('토요일 단축 진료를 반영한다', () => {
    const saturday = bookingDays(han, '2026-08-09', 7)[6]

    expect(saturday.weekday).toBe('sat')
    expect(saturday.slots.at(-1)).toBe('12:30')
  })

  it('토요일 휴진 의료기관은 토요일도 닫는다', () => {
    const saturday = bookingDays(skin, '2026-08-09', 7)[6]

    expect(saturday.isOpen).toBe(false)
  })
})

describe('firstOpenDay', () => {
  it('진료하는 가장 빠른 날을 고른다', () => {
    expect(firstOpenDay(bookingDays(han, '2026-08-09', 7))?.date).toBe('2026-08-10')
  })

  it('전부 휴진이면 없다', () => {
    expect(
      firstOpenDay([
        { date: '2026-08-09', weekday: 'sun', isOpen: false, bookable: false, slots: [] },
      ]),
    ).toBeNull()
  })

  /* 오늘 진료는 하지만 시간이 다 지났으면 그 날은 고를 수 없다. */
  it('오늘 지나간 시간대는 빼고 센다', () => {
    const [today] = bookingDays(han, '2026-08-10', 1, '18:30')

    expect(today.isOpen).toBe(true)
    expect(today.bookable).toBe(false)
    expect(today.slots).toEqual([])
  })

  it('오늘 남은 시간만 남긴다', () => {
    const [today] = bookingDays(han, '2026-08-10', 1, '15:00')

    expect(today.slots[0]).toBe('15:30')
  })

  it('내일부터는 시각과 무관하게 다 연다', () => {
    const days = bookingDays(han, '2026-08-10', 2, '18:30')

    expect(days[1].slots[0]).toBe('09:00')
  })
})
