import type { Doctor } from '../domain/types'

/**
 * 가상 의사. 실존 의료인이 아니다.
 * keywords는 의사가 직접 등록한 관심 주제이며 노출 우선권을 사는 수단이 아니다.
 */
export const demoDoctors: Doctor[] = [
  {
    id: 'doc-han-ent',
    name: '가상 김이비',
    clinicId: 'clinic-han',
    specialty: 'otolaryngology',
    licenseNumber: 'D-00001',
    licenseVerified: true,
    keywords: ['비염', '축농증', '코막힘'],
    notificationsEnabled: true,
    licenseType: '의사',
  },
  {
    id: 'doc-forest-im',
    name: '가상 박내과',
    clinicId: 'clinic-forest',
    specialty: 'internal-medicine',
    licenseNumber: 'D-00002',
    licenseVerified: true,
    keywords: ['속쓰림', '역류', '만성피로'],
    notificationsEnabled: true,
    licenseType: '의사',
  },
  {
    id: 'doc-skin-derm',
    name: '가상 정피부',
    clinicId: 'clinic-skin',
    specialty: 'dermatology',
    licenseNumber: 'D-00003',
    licenseVerified: true,
    keywords: ['두드러기', '만성 가려움'],
    notificationsEnabled: true,
    licenseType: '의사',
  },
  {
    id: 'doc-inha-psy',
    name: '가상 최마음',
    clinicId: 'clinic-inha',
    specialty: 'psychiatry',
    licenseNumber: 'D-00004',
    licenseVerified: true,
    keywords: ['불면', '잠', '수면리듬'],
    notificationsEnabled: false,
    licenseType: '의사',
  },
  {
    id: 'doc-forest-fm',
    name: '가상 이가정',
    clinicId: 'clinic-forest',
    specialty: 'family-medicine',
    licenseNumber: 'D-00005',
    licenseVerified: true,
    keywords: ['재처방', '건강검진'],
    notificationsEnabled: true,
    licenseType: '의사',
  },
  {
    id: 'doc-pending',
    name: '가상 한검증',
    clinicId: 'clinic-han',
    specialty: 'otolaryngology',
    licenseNumber: 'D-00006',
    licenseVerified: false,
    keywords: ['코막힘'],
    notificationsEnabled: true,
    licenseType: '의사',
  },
]

export function findDoctor(doctorId: string): Doctor | undefined {
  return demoDoctors.find((doctor) => doctor.id === doctorId)
}
