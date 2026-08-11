import type { Answer, Question } from '../../domain/types'

export interface QuestionActivity {
  kind: 'question'
  id: string
  occurredAt: string
  question: Question
}

export interface AnswerActivity {
  kind: 'answer'
  id: string
  occurredAt: string
  question: Question
  answer: Answer
}

export type MyActivityItem = QuestionActivity | AnswerActivity

export function buildMyActivity(
  questions: Question[],
  answers: Answer[],
  patientId: string,
): MyActivityItem[] {
  const mine = questions.filter((question) => question.patientId === patientId)
  const mineById = new Map(mine.map((question) => [question.id, question]))

  return [
    ...mine.map<QuestionActivity>((question) => ({
      kind: 'question',
      id: question.id,
      occurredAt: question.createdAt,
      question,
    })),
    ...answers.flatMap<AnswerActivity>((answer) => {
      const question = mineById.get(answer.questionId)
      return question
        ? [{ kind: 'answer', id: answer.id, occurredAt: answer.createdAt, question, answer }]
        : []
    }),
  ].sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
}

export interface ActivityGroup {
  question: Question
  answerCount: number
  latestAt: string
  hasAnswer: boolean
}

/**
 * 사연 하나를 한 줄로 묶는다.
 *
 * 낱개로 늘어놓으면 답변이 둘 달린 사연이 같은 제목으로 두 줄을 차지한다.
 * 홈의 좁은 목록에서는 무엇이 몇 개 왔는지가 알고 싶은 것이지
 * 답변 하나하나가 알고 싶은 것이 아니다.
 */
export function groupMyActivity(
  questions: Question[],
  answers: Answer[],
  patientId: string,
): ActivityGroup[] {
  return questions
    .filter((question) => question.patientId === patientId)
    .map((question) => {
      const own = answers.filter((answer) => answer.questionId === question.id)
      const latestAt = own.reduce(
        (latest, answer) => (answer.createdAt > latest ? answer.createdAt : latest),
        question.createdAt,
      )

      return {
        question,
        answerCount: own.length,
        latestAt,
        hasAnswer: own.length > 0,
      }
    })
    .sort(
      (left, right) =>
        right.latestAt.localeCompare(left.latestAt) ||
        left.question.id.localeCompare(right.question.id),
    )
}
