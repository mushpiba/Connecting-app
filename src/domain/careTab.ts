import type { BookingRequest, Clinic, Doctor, EncounterRequest } from './types'

/**
 * 진료 탭 1구역에 세울 한 건. 신청과 예약을 한 줄에 세운다.
 *
 * 둘은 다른 표에서 오지만 환자에게는 같은 것이다 — 지금 진행 중인 내 진료.
 * 두 목록으로 나누면 「내 요청이 어디까지 왔나」를 두 곳에서 찾게 된다.
 */
export interface UpcomingCareItem {
  id: string
  kind: 'encounter' | 'booking'
  /**
   * 0 진료방 열림 · 1 예약 예정 · 2 신청 대기 · 3 받지 못한 신청.
   * 저쪽에서 사람이 기다리는 쪽이 급하고, 끝난 이야기는 맨 아래다.
   */
  rank: number
  /** 같은 급함끼리는 최신순으로 가른다. */
  at: string
  encounter: EncounterRequest | null
  booking: BookingRequest | null
}

/**
 * 아직 끝나지 않은 내 진료를 급한 순으로.
 *
 * 끝난 것(`completed`)은 여기 없다 — 2구역이 「진료봤던 곳」으로 받는다.
 *
 * **거절된 것은 맨 아래에 남긴다.** 빼 봤더니 신청이 어디에도 안 나타나서, 환자는
 * 거절됐다는 사실도 못 보고 그냥 사라진 것을 봤다. 아픈 상태에서 그 모름은 그냥
 * 불안이다(P-1). 진행 중인 것을 가리지 않도록 맨 아래에 두고, 다음에 할 수 있는
 * 것은 `encounterTrack`이 적는다.
 */
function encounterRank(status: EncounterRequest['status']): number {
  if (status === 'in-progress') return 0
  if (status === 'declined') return 3
  return 2
}

export function upcomingCare(
  bookings: BookingRequest[],
  encounters: EncounterRequest[],
  patientId: string,
  today: string,
): UpcomingCareItem[] {
  const items: UpcomingCareItem[] = [
    ...encounters
      .filter((item) => item.patientId === patientId && item.status !== 'completed')
      .map<UpcomingCareItem>((encounter) => ({
        id: encounter.id,
        kind: 'encounter',
        rank: encounterRank(encounter.status),
        at: encounter.createdAt,
        encounter,
        booking: null,
      })),
    ...bookings
      .filter((booking) => booking.date >= today)
      .map<UpcomingCareItem>((booking) => ({
        id: booking.id,
        kind: 'booking',
        rank: 1,
        at: booking.requestedAt,
        encounter: null,
        booking,
      })),
  ]

  return items.sort((left, right) => left.rank - right.rank || right.at.localeCompare(left.at))
}

/** 2구역 「앱에서 진료받은 곳」 한 줄. 검증된 출처만 들어온다. */
export interface PriorCarePlace {
  clinicId: string
  name: string
  lastVisitedOn: string
  doctorNames: string[]
}

/**
 * 앱이 만든 기록에서만 뽑는 재진 이력.
 *
 * 지나간 예약과 끝난 진료가 근거다. **앞으로의 예약은 넣지 않는다** — 그건
 * 1구역이 이미 세우고 있고, 가기로 한 것을 「진료받은 곳」이라 부르면 이 목록이
 * 검증됐다고 말할 근거가 사라진다.
 */
export function priorCarePlaces(
  bookings: BookingRequest[],
  encounters: EncounterRequest[],
  clinics: Clinic[],
  doctors: Doctor[],
  patientId: string,
  today: string,
): PriorCarePlace[] {
  const visits: Array<{ clinicId: string; on: string; doctorId: string }> = [
    ...bookings
      .filter((booking) => booking.date < today)
      .map((booking) => ({ clinicId: booking.clinicId, on: booking.date, doctorId: booking.doctorId })),
    ...encounters
      .filter((item) => item.patientId === patientId && item.status === 'completed')
      .map((item) => ({
        clinicId: item.clinicId,
        on: item.createdAt.slice(0, 10),
        doctorId: item.doctorId,
      })),
  ]

  const byClinic = new Map<string, PriorCarePlace>()

  for (const visit of visits) {
    const name = clinics.find((clinic) => clinic.id === visit.clinicId)?.name
    if (!name) continue

    const doctorName = doctors.find((doctor) => doctor.id === visit.doctorId)?.name
    const place = byClinic.get(visit.clinicId) ?? {
      clinicId: visit.clinicId,
      name,
      lastVisitedOn: visit.on,
      doctorNames: [],
    }

    if (visit.on > place.lastVisitedOn) place.lastVisitedOn = visit.on
    if (doctorName && !place.doctorNames.includes(doctorName)) place.doctorNames.push(doctorName)
    byClinic.set(visit.clinicId, place)
  }

  return [...byClinic.values()].sort(
    (left, right) =>
      right.lastVisitedOn.localeCompare(left.lastVisitedOn) || left.name.localeCompare(right.name),
  )
}
