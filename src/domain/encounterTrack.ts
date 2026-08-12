import type { EncounterRequest } from './types'

export interface TrackStep {
  id: string
  label: string
  done: boolean
  current: boolean
}

export interface EncounterTrack {
  encounterId: string
  steps: TrackStep[]
  headline: string
  detail: string
  /** 지금 진료방에 들어갈 수 있는가. 의사가 열어야 들어간다. */
  roomOpen: boolean
}

const order: EncounterRequest['status'][] = ['requested', 'accepted', 'in-progress', 'completed']

/**
 * 신청이 지금 어디까지 왔는지.
 *
 * 신청 버튼이 회색으로 변하는 것이 전부였다. 그러면 신청한 사람은 자기 요청이
 * 살아 있는지 사라졌는지 알 수 없고, 아픈 상태에서 그 모름은 그냥 불안이다.
 * 택배 추적처럼 어디까지 왔는지와 다음에 무엇이 일어나는지를 같이 적는다.
 */
export function encounterTrack(encounter: EncounterRequest, doctorName: string): EncounterTrack {
  const at = order.indexOf(encounter.status)
  const declined = encounter.status === 'declined'

  const steps: TrackStep[] = [
    { id: 'requested', label: '신청함', done: at >= 0, current: at === 0 },
    { id: 'accepted', label: '의사 확인', done: at >= 1, current: at === 1 },
    { id: 'in-progress', label: '진료방 열림', done: at >= 2, current: at === 2 },
    { id: 'completed', label: '진료 마침', done: at >= 3, current: at === 3 },
  ]

  if (declined) {
    return {
      encounterId: encounter.id,
      steps: steps.map((step) => ({ ...step, done: step.id === 'requested', current: false })),
      headline: '이번 신청은 받지 못했습니다',
      detail: `${doctorName}이 비대면으로 보기 어렵다고 판단했습니다. 대면 진료를 예약하거나 다른 의사에게 물어볼 수 있습니다.`,
      roomOpen: false,
    }
  }

  const copy: Record<EncounterRequest['status'], { headline: string; detail: string }> = {
    requested: {
      headline: '진료 신청을 보냈습니다',
      detail: `${doctorName}이 확인하면 알려 드립니다. 아직 진료방은 열리지 않았습니다.`,
    },
    accepted: {
      headline: '의사가 신청을 확인했습니다',
      detail: `${doctorName}이 진료방을 열면 바로 들어갈 수 있습니다.`,
    },
    'in-progress': {
      headline: '진료방이 열렸습니다',
      detail: `${doctorName}이 기다리고 있습니다. 지금 들어가세요.`,
    },
    completed: {
      headline: '진료가 끝났습니다',
      detail: '기록은 의료기관이 보관합니다. 이 화면에는 남지 않습니다.',
    },
    declined: { headline: '', detail: '' },
  }

  return {
    encounterId: encounter.id,
    steps,
    headline: copy[encounter.status].headline,
    detail: copy[encounter.status].detail,
    roomOpen: encounter.status === 'in-progress',
  }
}

/** 아직 끝나지 않은 내 신청. 홈에 세울 것 하나를 고른다. */
export function activeEncounter(
  encounters: EncounterRequest[],
  patientId: string,
): EncounterRequest | null {
  const mine = encounters.filter(
    (item) =>
      item.patientId === patientId && item.status !== 'completed' && item.status !== 'declined',
  )
  if (mine.length === 0) return null

  // 진료방이 열린 것이 있으면 그것부터. 사람이 기다리는 쪽이 급하다.
  return mine.find((item) => item.status === 'in-progress') ?? mine[0]
}
