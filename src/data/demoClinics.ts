import type { Clinic, ClinicHours } from '../domain/types'

export const demoRegions = ['인천 미추홀구', '서울 성동구', '서울 강남구', '경기 성남시'] as const

/** 평일 종일, 토요일 단축, 일요일 휴진. 의원급 기본형. */
function weekdayHours(open: string, close: string, saturdayClose: string | null): ClinicHours[] {
  return [
    { weekday: 'mon', open, close },
    { weekday: 'tue', open, close },
    { weekday: 'wed', open, close },
    { weekday: 'thu', open, close },
    { weekday: 'fri', open, close },
    { weekday: 'sat', open: saturdayClose ? open : null, close: saturdayClose },
    { weekday: 'sun', open: null, close: null },
  ]
}

/**
 * 가상 의료기관. 판정 분기를 전부 하나씩 담당한다.
 * 비대면 미운영, 월 비율 상한 초과, 병원급 예외 요건이 각각 한 곳씩이다.
 */
export const demoClinics: Clinic[] = [
  {
    id: 'clinic-han',
    name: '가상 한빛이비인후과의원',
    level: 'clinic',
    region: '인천 미추홀구',
    address: '인천 미추홀구 가상로 12, 2층',
    phone: '032-000-0001',
    bookingUrl: 'https://example.invalid/clinic-han',
    telemedicineEnabled: true,
    monthlyTelemedicineRatio: 0.18,
    landmark: '가상역 3번 출구에서 도보 4분, 한빛빌딩 2층',
    hours: weekdayHours('09:00', '18:30', '13:00'),
    lunchBreak: '13:00–14:00',
  },
  {
    id: 'clinic-forest',
    name: '가상 서울숲내과의원',
    level: 'clinic',
    region: '서울 성동구',
    address: '서울 성동구 가상길 34, 3층',
    phone: '02-000-0002',
    bookingUrl: 'https://example.invalid/clinic-forest',
    telemedicineEnabled: true,
    monthlyTelemedicineRatio: 0.34,
    landmark: '가상숲공원 정문 건너편, 숲빌딩 3층',
    hours: weekdayHours('08:30', '18:00', '12:30'),
    lunchBreak: '12:30–13:30',
  },
  {
    id: 'clinic-skin',
    name: '가상 미추홀피부과의원',
    level: 'clinic',
    region: '인천 미추홀구',
    address: '인천 미추홀구 가상로 56, 5층',
    phone: '032-000-0003',
    bookingUrl: 'https://example.invalid/clinic-skin',
    telemedicineEnabled: false,
    monthlyTelemedicineRatio: 0,
    landmark: '가상시장 사거리 모퉁이, 미추홀타워 5층',
    hours: weekdayHours('10:00', '19:00', null),
    lunchBreak: '13:00–14:00',
  },
  {
    id: 'clinic-inha',
    name: '가상 인하늘병원',
    level: 'hospital',
    region: '인천 미추홀구',
    address: '인천 미추홀구 가상대로 78',
    phone: '032-000-0004',
    bookingUrl: 'https://example.invalid/clinic-inha',
    telemedicineEnabled: true,
    monthlyTelemedicineRatio: 0.12,
    landmark: '가상대로 사거리, 본관 1층 외래 접수',
    hours: weekdayHours('08:00', '17:30', '12:00'),
    lunchBreak: '12:30–13:30',
  },
]

export function findClinic(clinicId: string): Clinic | undefined {
  return demoClinics.find((clinic) => clinic.id === clinicId)
}
