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
    bio: '코와 목 증상을 오래 봐 왔습니다. 오래 끄는 코막힘과 만성 비염을 주로 봅니다.',
    consultStyle:
      '증상이 시작된 시점과 하루 중 언제 심해지는지를 먼저 여쭙습니다. 필요하면 내시경 확인을 위해 대면 진료로 안내드립니다.',
    career: ['가상 한빛이비인후과의원 원장', '이비인후과 전문의', '가상의과대학 졸업'],
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
    bio: '소화기 증상과 만성 피로를 주로 봅니다.',
    consultStyle: '식사·수면 패턴을 함께 보고 생활 조정부터 제안합니다.',
    career: ['가상 서울숲내과의원 원장', '내과 전문의'],
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
    bio: '원인을 못 찾은 두드러기와 만성 가려움을 오래 봤습니다.',
    consultStyle: '언제 어디에 어떻게 올라오는지 기록을 함께 봅니다. 피부는 직접 봐야 하는 경우가 많습니다.',
    career: ['가상 미추홀피부과의원 원장', '피부과 전문의'],
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
    bio: '수면 문제와 불안을 주로 봅니다.',
    consultStyle: '잠들기까지 걸리는 시간과 깨는 횟수를 2주간 기록해 오시면 이야기가 빨라집니다.',
    career: ['가상 인하늘병원 정신건강의학과', '정신건강의학과 전문의'],
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
    bio: '어느 과로 가야 할지 애매한 증상을 정리해 드립니다.',
    consultStyle: '먼저 어디부터 확인할지 순서를 잡아 드리고, 필요한 과로 안내합니다.',
    career: ['가상 서울숲내과의원 가정의학과', '가정의학과 전문의'],
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
    bio: '면허 검증 대기 중인 계정입니다.',
    consultStyle: '검증이 끝나기 전에는 질문이 전달되지 않습니다.',
    career: [],
  },
]

export function findDoctor(doctorId: string): Doctor | undefined {
  return demoDoctors.find((doctor) => doctor.id === doctorId)
}
