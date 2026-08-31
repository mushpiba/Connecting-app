import { priorCarePlaces, upcomingCare } from './careTab'
import { demoClinics } from '../data/demoClinics'
import { demoDoctors } from '../data/demoDoctors'
import type { BookingRequest, EncounterRequest } from './types'

const today = '2026-08-09'

function booking(overrides: Partial<BookingRequest> = {}): BookingRequest {
  return {
    id: 'b-1',
    doctorId: 'doc-han-ent',
    clinicId: 'clinic-han',
    date: '2026-08-20',
    time: '10:30',
    requestedAt: '2026-08-09T01:00:00.000Z',
    documentTypes: [],
    ...overrides,
  }
}

function encounter(overrides: Partial<EncounterRequest> = {}): EncounterRequest {
  return {
    id: 'e-1',
    questionId: 'q-1',
    patientId: 'p-1',
    doctorId: 'doc-han-ent',
    clinicId: 'clinic-han',
    status: 'requested',
    createdAt: '2026-08-08T01:00:00.000Z',
    ...overrides,
  }
}

describe('upcomingCare', () => {
  it('진료방이 열린 것을 예약보다 위에 세운다', () => {
    const items = upcomingCare(
      [booking()],
      [encounter({ status: 'in-progress' })],
      'p-1',
      today,
    )

    expect(items.map((item) => item.kind)).toEqual(['encounter', 'booking'])
  })

  it('아직 열리지 않은 신청은 예약 아래로 내려간다', () => {
    const items = upcomingCare([booking()], [encounter()], 'p-1', today)

    expect(items.map((item) => item.kind)).toEqual(['booking', 'encounter'])
  })

  it('끝난 신청과 지나간 예약은 세우지 않는다', () => {
    const items = upcomingCare(
      [booking({ date: '2026-07-01' })],
      [encounter({ status: 'completed' })],
      'p-1',
      today,
    )

    expect(items).toEqual([])
  })

  /** 빼 버리면 환자는 신청이 사라진 것만 본다. 그 모름이 곧 불안이다 (P-1). */
  it('거절된 신청은 맨 아래에 남긴다', () => {
    const items = upcomingCare(
      [booking()],
      [encounter({ id: 'e-2', status: 'declined' }), encounter({ status: 'in-progress' })],
      'p-1',
      today,
    )

    expect(items.map((item) => item.id)).toEqual(['e-1', 'b-1', 'e-2'])
  })

  it('남의 신청은 들어오지 않는다', () => {
    const items = upcomingCare([], [encounter({ patientId: 'p-2' })], 'p-1', today)

    expect(items).toEqual([])
  })
})

describe('priorCarePlaces', () => {
  it('지나간 예약과 끝난 진료만 재진 이력이 된다', () => {
    const places = priorCarePlaces(
      [booking({ date: '2026-07-02' }), booking({ id: 'b-2', date: '2026-09-01' })],
      [],
      demoClinics,
      demoDoctors,
      'p-1',
      today,
    )

    expect(places).toHaveLength(1)
    expect(places[0].lastVisitedOn).toBe('2026-07-02')
  })

  it('같은 의료기관은 한 줄로 묶고 마지막 진료일을 남긴다', () => {
    const places = priorCarePlaces(
      [booking({ date: '2026-05-02' }), booking({ id: 'b-2', date: '2026-07-02' })],
      [],
      demoClinics,
      demoDoctors,
      'p-1',
      today,
    )

    expect(places).toHaveLength(1)
    expect(places[0].lastVisitedOn).toBe('2026-07-02')
    expect(places[0].doctorNames).toEqual(['가상 김이비'])
  })

  it('마지막 진료일이 가까운 곳부터 늘어놓는다', () => {
    const places = priorCarePlaces(
      [
        booking({ date: '2026-05-02' }),
        booking({ id: 'b-2', clinicId: 'clinic-skin', doctorId: 'doc-skin-derm', date: '2026-07-02' }),
      ],
      [],
      demoClinics,
      demoDoctors,
      'p-1',
      today,
    )

    expect(places.map((place) => place.clinicId)).toEqual(['clinic-skin', 'clinic-han'])
  })

  it('우리가 모르는 의료기관은 이름을 만들어 내지 않고 버린다', () => {
    const places = priorCarePlaces(
      [booking({ clinicId: 'clinic-unknown', date: '2026-05-02' })],
      [],
      demoClinics,
      demoDoctors,
      'p-1',
      today,
    )

    expect(places).toEqual([])
  })
})
