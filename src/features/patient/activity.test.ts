import { demoAnswers, demoCurrentPatientId, demoQuestions } from '../../data/demoQuestions'
import { buildMyActivity } from './activity'

describe('buildMyActivity', () => {
  it('내 사연과 그 사연에 달린 답변만 최신순으로 모은다', () => {
    const activity = buildMyActivity(demoQuestions, demoAnswers, demoCurrentPatientId)

    expect(activity.map((item) => `${item.kind}:${item.id}`)).toEqual([
      'question:q-followup',
      'answer:a-nose-2',
      'answer:a-nose-1',
      'question:q-nose',
      'question:q-eye',
    ])
  })

  it('내 사연이 없으면 다른 사람의 사연과 답변을 노출하지 않는다', () => {
    expect(buildMyActivity(demoQuestions, demoAnswers, 'pat-missing')).toEqual([])
  })
})
