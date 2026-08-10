import type { Clinic } from '../domain/types'

export const demoRegions = ['인천 미추홀구', '서울 성동구', '서울 강남구', '경기 성남시'] as const

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
    address: '인천 미추홀구 가상로 12',
    phone: '032-000-0001',
    bookingUrl: 'https://example.invalid/clinic-han',
    telemedicineEnabled: true,
    monthlyTelemedicineRatio: 0.18,
  },
  {
    id: 'clinic-forest',
    name: '가상 서울숲내과의원',
    level: 'clinic',
    region: '서울 성동구',
    address: '서울 성동구 가상길 34',
    phone: '02-000-0002',
    bookingUrl: 'https://example.invalid/clinic-forest',
    telemedicineEnabled: true,
    monthlyTelemedicineRatio: 0.34,
  },
  {
    id: 'clinic-skin',
    name: '가상 미추홀피부과의원',
    level: 'clinic',
    region: '인천 미추홀구',
    address: '인천 미추홀구 가상로 56',
    phone: '032-000-0003',
    bookingUrl: 'https://example.invalid/clinic-skin',
    telemedicineEnabled: false,
    monthlyTelemedicineRatio: 0,
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
  },
]

export function findClinic(clinicId: string): Clinic | undefined {
  return demoClinics.find((clinic) => clinic.id === clinicId)
}
