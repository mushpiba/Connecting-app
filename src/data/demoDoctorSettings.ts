import type { DoctorSettings } from '../domain/types'

/**
 * 의사마다 다르게 채운 시연 설정.
 *
 * 키워드와 알림 상한과 비대면 운영 방식이 사람마다 다르다는 것이 화면에서
 * 보여야 한다. 전부 같은 값이면 이 설정이 왜 있는지 알 수 없다.
 */
export const demoDoctorSettings: DoctorSettings[] = [
  {
    doctorId: 'doc-han-ent',
    keywords: ['비염', '축농증', '코막힘', '중이염', '목쉼'],
    dailyNotificationLimit: 10,
    telemedicineEnabled: true,
    slotMinutes: 15,
    acceptsFirstVisit: true,
    telemedicineBands: ['morning', 'afternoon'],
    telemedicineNote: '증상이 시작된 시점과 하루 중 언제 심해지는지 메모해 오시면 빠릅니다.',
  },
  {
    doctorId: 'doc-forest-im',
    keywords: ['속쓰림', '역류', '만성피로', '체중', '건강검진 결과'],
    dailyNotificationLimit: 5,
    telemedicineEnabled: true,
    slotMinutes: 20,
    acceptsFirstVisit: false,
    telemedicineBands: ['morning'],
    telemedicineNote: '드시는 약이 있으면 이름을 적어 두시고, 최근 검사지가 있으면 준비해 주세요.',
  },
  {
    doctorId: 'doc-skin-derm',
    keywords: ['두드러기', '만성 가려움', '습진', '원인 미상'],
    dailyNotificationLimit: 8,
    telemedicineEnabled: false,
    slotMinutes: 15,
    acceptsFirstVisit: false,
    telemedicineBands: [],
    telemedicineNote: '피부는 직접 봐야 하는 경우가 많아 대면으로만 진료합니다.',
  },
  {
    doctorId: 'doc-inha-psy',
    keywords: ['불면', '수면리듬', '불안', '공황'],
    dailyNotificationLimit: 3,
    telemedicineEnabled: true,
    slotMinutes: 30,
    acceptsFirstVisit: false,
    telemedicineBands: ['afternoon', 'night'],
    telemedicineNote: '2주치 수면 기록을 적어 오시면 이야기가 훨씬 빨라집니다.',
  },
  {
    doctorId: 'doc-forest-fm',
    keywords: ['재처방', '건강검진', '어느 과로 가야 할지'],
    dailyNotificationLimit: 15,
    telemedicineEnabled: true,
    slotMinutes: 10,
    acceptsFirstVisit: true,
    telemedicineBands: ['morning', 'afternoon', 'night'],
    telemedicineNote: '어느 과로 가야 할지 모르겠는 경우 먼저 정리해 드립니다.',
  },
  {
    doctorId: 'doc-pending',
    keywords: [],
    dailyNotificationLimit: 5,
    telemedicineEnabled: false,
    slotMinutes: 15,
    acceptsFirstVisit: false,
    telemedicineBands: [],
    telemedicineNote: '',
  },
]

export function settingsFor(doctorId: string): DoctorSettings {
  return (
    demoDoctorSettings.find((item) => item.doctorId === doctorId) ?? {
      doctorId,
      keywords: [],
      dailyNotificationLimit: 5,
      telemedicineEnabled: false,
      slotMinutes: 15,
      acceptsFirstVisit: false,
      telemedicineBands: [],
      telemedicineNote: '',
    }
  )
}
