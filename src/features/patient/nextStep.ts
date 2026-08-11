import { symptomDurationDays } from '../../domain/intake'
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
      actionPath: '/me/appointments',
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
