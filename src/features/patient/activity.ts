import type { Answer, PrivateMessage, PrivateThread, Question } from '../../domain/types'

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

/**
 * 비공개 회신이 도착한 것 (Q-7).
 *
 * **본문을 담지 않는다.** 비공개 대화는 민감정보(개인정보보호법 제23조)이고
 * `/news`는 목록 화면이다. 카드에는 누가·어느 사연에·언제까지만 나오고 본문은
 * `/questions/:questionId`에 들어가야 보인다.
 */
export interface PrivateReplyActivity {
  kind: 'private-reply'
  id: string
  occurredAt: string
  question: Question
  doctorId: string
}

export type MyActivityItem = QuestionActivity | AnswerActivity | PrivateReplyActivity

/**
 * 내 소식을 낱개로 늘어놓는다.
 *
 * 비공개 회신이 여기 섞이는 것은 **회신이 답변의 연장**이기 때문이다(D-8이
 * 상한을 셀 때 쓴 것과 같은 판단). 별도 화면으로 빼면 환자는 같은 사연의 소식을
 * 두 곳에서 찾게 된다.
 *
 * **회신이라고 위로 올리지 않는다.** 정렬은 발생 시각 하나뿐이다 — 회신이
 * 실시간으로 오지 않는다는 사실(Realtime 발행 안 함)을 순서로 덮지 않는다.
 */
export function buildMyActivity(
  questions: Question[],
  answers: Answer[],
  privateThreads: PrivateThread[],
  privateMessages: PrivateMessage[],
  patientId: string,
): MyActivityItem[] {
  const mine = questions.filter((question) => question.patientId === patientId)
  const mineById = new Map(mine.map((question) => [question.id, question]))
  const myThreads = new Map(
    privateThreads
      .filter((thread) => thread.patientId === patientId)
      .map((thread) => [thread.id, thread]),
  )

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
    // 내가 쓴 발화는 소식이 아니다. 도착한 것만 센다.
    ...privateMessages.flatMap<PrivateReplyActivity>((message) => {
      if (message.senderRole !== 'doctor') return []
      const thread = myThreads.get(message.threadId)
      const question = thread ? mineById.get(thread.questionId) : undefined
      return thread && question
        ? [
            {
              kind: 'private-reply',
              id: message.id,
              occurredAt: message.createdAt,
              question,
              doctorId: thread.doctorId,
            },
          ]
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
