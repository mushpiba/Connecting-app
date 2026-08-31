import { symptomDurationDays } from '../../domain/intake'
import type { EncounterTrack } from '../../domain/encounterTrack'
import type { Answer, BookingRequest, Question } from '../../domain/types'

export type NextStepKind = 'first-visit' | 'waiting' | 'answered' | 'booked'

export interface NextStep {
  kind: NextStepKind
  title: string
  detail: string
  actionLabel: string
  actionPath: string
  /** 카드에서 함께 보여줄 사연. 첫 방문이면 없다. */
  question: Question | null
  answerCount: number
  booking: BookingRequest | null
}

/**
 * 홈 최상단에 무엇을 보여줄지 정한다.
 *
 * 환자가 이 앱을 여는 이유는 셋뿐이다. 증상을 적으러, 답변이 왔나 보러,
 * 진료를 잡으러. 그래서 홈은 읽을거리가 아니라 내 건이 어디까지 왔는지다.
 * 우선순위는 뒤에서부터다. 예약이 잡혀 있으면 그것이 가장 급한 정보다.
 */
export function resolveNextStep(
  questions: Question[],
  answers: Answer[],
  bookings: BookingRequest[],
  patientId: string,
  today: string,
): NextStep {
  const mine = [...questions]
    .filter((question) => question.patientId === patientId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))

  const latestBooking = bookings.at(-1) ?? null
  if (latestBooking) {
    return {
      kind: 'booked',
      title: '예약 희망 시간을 전달했어요',
      detail: `${latestBooking.date} ${latestBooking.time} · 병원 확인 후 확정됩니다.`,
      actionLabel: '예약 내역 보기',
      actionPath: '/care',
      question: null,
      answerCount: 0,
      booking: latestBooking,
    }
  }

  if (mine.length === 0) {
    return {
      kind: 'first-visit',
      title: '어디가 불편하신가요',
      detail: '증상을 적어 주시면 어느 과로 가면 좋을지 정리해 드립니다. 비공개로도 올릴 수 있어요.',
      actionLabel: '증상 적어보기',
      actionPath: '/ask',
      question: null,
      answerCount: 0,
      booking: null,
    }
  }

  const withAnswer = mine.find((question) =>
    answers.some((answer) => answer.questionId === question.id),
  )

  if (withAnswer) {
    const count = answers.filter((answer) => answer.questionId === withAnswer.id).length
    return {
      kind: 'answered',
      title: `의사 ${count}명이 답변했어요`,
      detail: withAnswer.title,
      actionLabel: '답변 확인하기',
      actionPath: `/questions/${withAnswer.id}`,
      question: withAnswer,
      answerCount: count,
      booking: null,
    }
  }

  const waiting = mine[0]
  return {
    kind: 'waiting',
    title: '답변을 기다리는 중이에요',
    detail: `${waiting.title} · 증상 ${symptomDurationDays(waiting.onsetDate, today)}일째`,
    actionLabel: '내 사연 보기',
    actionPath: `/questions/${waiting.id}`,
    question: waiting,
    answerCount: 0,
    booking: null,
  }
}

export type ProgressStripKind = 'room-open' | 'booked' | 'answered' | 'waiting'

export interface ProgressStrip {
  kind: ProgressStripKind
  label: string
  path: string
}

/**
 * 사연 피드 위에 붙는 한 줄.
 *
 * D-5가 홈을 사연 피드로 정하면서 갈 곳을 아는 환자에게 한 단계가 늘었다. 그
 * 비용을 홈을 사람마다 다르게 만들어서 갚지 않는다 — 홈이 사람마다 다르면
 * 설명도 테스트도 어려워진다. 대신 얇은 줄 하나를 고정한다.
 *
 * **새로 계산하는 것이 없다.** 우선순위 판단은 `resolveNextStep`에, 신청의
 * 4단계는 `encounterTrack`에 이미 있다. 같은 함수가 더 얇은 자리에 붙는다.
 * 진료방이 열린 것만 그 위에 온다 — 저쪽에서 사람이 기다리고 있다.
 *
 * 진행 중인 건이 없으면 null 이다. 화면은 자리도 만들지 않는다.
 */
export function progressStrip(
  step: NextStep,
  track: EncounterTrack | null,
  today: string,
): ProgressStrip | null {
  if (track?.roomOpen) {
    return {
      kind: 'room-open',
      label: '진료방이 열렸습니다 · 지금 들어가세요',
      path: `/visit/${track.encounterId}`,
    }
  }

  if (step.kind === 'booked' && step.booking) {
    return {
      kind: 'booked',
      label: `예약 희망 시간을 전달했어요 · ${step.booking.date} ${step.booking.time}`,
      path: '/care',
    }
  }

  if (step.kind === 'answered' && step.question) {
    return {
      kind: 'answered',
      label: `의사 ${step.answerCount}명이 답변했어요`,
      path: `/questions/${step.question.id}`,
    }
  }

  if (step.kind === 'waiting' && step.question) {
    const days = symptomDurationDays(step.question.onsetDate, today)
    return {
      kind: 'waiting',
      label: `답변을 기다리는 중 · 증상 ${days}일째`,
      path: `/questions/${step.question.id}`,
    }
  }

  return null
}
