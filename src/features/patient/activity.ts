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
