import type { Specialty } from '../../domain/types'

export interface AnswerTemplate {
  id: string
  label: string
  body: string
  /** 비어 있으면 모든 과에서 쓴다. */
  specialties: Specialty[]
}

/**
 * 자주 쓰는 답변 문구.
 *
 * 의사 시간을 가장 많이 아끼는 자리다. 다만 그대로 보내라고 만든 것이 아니라
 * 첫 줄을 대신 써 주는 것이다. 환자마다 덧붙일 말이 다르므로 넣은 뒤 고친다.
 *
 * 진단명을 담지 않는다. 문구가 진단이 되면 읽는 사람이 확진으로 받아들인다.
 */
export const answerTemplates: AnswerTemplate[] = [
  {
    id: 'need-visit',
    label: '대면 진료 권유',
    body: '적어 주신 내용만으로는 확인이 어려워 한 번은 대면으로 보는 편이 좋겠습니다. 진료 때 증상이 시작된 시점과 지금까지의 변화를 함께 말씀해 주세요.',
    specialties: [],
  },
  {
    id: 'watch-2weeks',
    label: '경과 관찰 안내',
    body: '지금 단계에서는 2주 정도 경과를 보면서 달라지는 점을 기록해 보시길 권합니다. 더 심해지거나 새로운 증상이 생기면 그때 진료를 받으세요.',
    specialties: [],
  },
  {
    id: 'red-flag',
    label: '응급 안내',
    body: '적어 주신 증상 중에 지금 바로 확인이 필요한 것이 있습니다. 커뮤니티 답변을 기다리지 마시고 119나 가까운 응급실을 먼저 이용해 주세요.',
    specialties: [],
  },
  {
    id: 'record-diary',
    label: '증상 기록 요청',
    body: '언제 심해지는지, 무엇을 하면 나아지는지 2주간 적어 오시면 원인을 좁히는 데 큰 도움이 됩니다. 하루 중 시간과 함께 적어 주세요.',
    specialties: [],
  },
  {
    id: 'ent-nasal',
    label: '코 증상 안내',
    body: '2주 넘게 이어지는 코막힘은 단순 감기보다 비염이나 부비동 문제를 함께 봅니다. 밤에 어느 쪽 코가 더 막히는지 확인해 보세요.',
    specialties: ['otolaryngology'],
  },
  {
    id: 'im-reflux',
    label: '위 증상 안내',
    body: '식후에 심해지는 속쓰림은 식사량과 눕는 시간과 관련이 있는 경우가 많습니다. 저녁 식사 후 두 시간은 눕지 않도록 해 보세요.',
    specialties: ['internal-medicine'],
  },
  {
    id: 'derm-photo',
    label: '피부 사진 요청',
    body: '피부는 직접 봐야 판단이 되는 경우가 많습니다. 같은 자리를 하루 중 다른 시간에 두세 장 찍어 두시면 진료 때 도움이 됩니다.',
    specialties: ['dermatology'],
  },
  {
    id: 'psy-sleep',
    label: '수면 기록 요청',
    body: '잠자리에 든 시각과 잠들기까지 걸린 시간, 깬 횟수를 2주만 적어 오시면 이야기가 훨씬 빨라집니다.',
    specialties: ['psychiatry'],
  },
]

export function templatesFor(specialty: Specialty): AnswerTemplate[] {
  return answerTemplates.filter(
    (template) => template.specialties.length === 0 || template.specialties.includes(specialty),
  )
}
