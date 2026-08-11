import type { DocumentType } from './types'

export interface DocumentOption {
  type: DocumentType
  label: string
  /** 어디에 쓰는 서류인지. 이름만으로는 무엇을 고를지 알 수 없다. */
  purpose: string
}

/**
 * 진료 후 발급받을 서류.
 *
 * 서류가 진료의 부산물이 아니라 목적인 경우가 있다. 실손 청구나 회사 제출
 * 때문에 진료를 받기도 한다. 그래서 신청 단계에서 함께 고른다.
 * 발급 자체는 병원이 한다. 우리가 만들어 주지 않는다.
 */
export const documentOptions: DocumentOption[] = [
  {
    type: 'visit-certificate',
    label: '진료확인서',
    purpose: '병원 방문 사실 증명 · 회사나 학교 제출용',
  },
  {
    type: 'receipt',
    label: '진료비 영수증',
    purpose: '결제 내역 영수증 · 실손보험 청구용',
  },
  {
    type: 'itemized-receipt',
    label: '진료비 세부내역서',
    purpose: '진료 항목별 상세 비용 내역',
  },
]

export function documentLabel(type: DocumentType): string {
  return documentOptions.find((option) => option.type === type)?.label ?? type
}

/** 시간 칸을 새벽·오전·오후·야간으로 묶는다. 60칸을 평평하게 두면 못 고른다. */
export type SlotBand = 'dawn' | 'morning' | 'afternoon' | 'night'

export interface SlotGroup {
  band: SlotBand
  label: string
  /** 의사가 적을 수 있는 시간대에는 미리 알려 준다. */
  note: string
  slots: string[]
}

const bandLabels: Record<SlotBand, { label: string; note: string }> = {
  dawn: { label: '새벽', note: '이 시간대에는 진료 가능한 의사가 적을 수 있어요.' },
  morning: { label: '오전', note: '' },
  afternoon: { label: '오후', note: '' },
  night: { label: '야간', note: '이 시간대에는 진료 가능한 의사가 적을 수 있어요.' },
}

function bandOf(slot: string): SlotBand {
  const hour = Number(slot.slice(0, 2))
  if (hour < 8) return 'dawn'
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'night'
}

export function groupSlots(slots: string[]): SlotGroup[] {
  const order: SlotBand[] = ['dawn', 'morning', 'afternoon', 'night']

  return order
    .map((band) => ({
      band,
      label: bandLabels[band].label,
      note: bandLabels[band].note,
      slots: slots.filter((slot) => bandOf(slot) === band),
    }))
    .filter((group) => group.slots.length > 0)
}
