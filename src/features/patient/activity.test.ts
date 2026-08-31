import { demoAnswers, demoCurrentPatientId, demoQuestions } from '../../data/demoQuestions'
import { buildMyActivity, groupMyActivity } from './activity'

describe('buildMyActivity', () => {
  it('내 사연과 그 사연에 달린 답변만 최신순으로 모은다', () => {
    const activity = buildMyActivity(demoQuestions, demoAnswers, [], [], demoCurrentPatientId)

    expect(activity.map((item) => `${item.kind}:${item.id}`)).toEqual([
      'question:q-followup',
      'answer:a-nose-2',
      'answer:a-nose-1',
      'question:q-nose',
      'question:q-eye',
    ])
  })

  it('내 사연이 없으면 다른 사람의 사연과 답변을 노출하지 않는다', () => {
    expect(buildMyActivity(demoQuestions, demoAnswers, [], [], 'pat-missing')).toEqual([])
  })
})

describe('groupMyActivity', () => {
  it('사연 하나를 한 줄로 묶는다', () => {
    const groups = groupMyActivity(demoQuestions, demoAnswers, 'pat-min')

    expect(groups.map((group) => group.question.id)).toEqual([
      'q-followup',
      'q-nose',
      'q-eye',
    ])
  })

  it('묶은 줄에 답변 수를 함께 준다', () => {
    const groups = groupMyActivity(demoQuestions, demoAnswers, 'pat-min')
    const nose = groups.find((group) => group.question.id === 'q-nose')!

    expect(nose.answerCount).toBe(2)
    expect(nose.hasAnswer).toBe(true)
  })

  it('답변이 없으면 사연 작성 시각을 쓴다', () => {
    const groups = groupMyActivity(demoQuestions, demoAnswers, 'pat-min')
    const followup = groups.find((group) => group.question.id === 'q-followup')!

    expect(followup.answerCount).toBe(0)
    expect(followup.latestAt).toBe(followup.question.createdAt)
  })

  it('답변이 오면 가장 늦은 답변 시각으로 올라온다', () => {
    const groups = groupMyActivity(demoQuestions, demoAnswers, 'pat-min')
    const nose = groups.find((group) => group.question.id === 'q-nose')!

    expect(nose.latestAt).toBe('2026-08-08T15:30:00.000Z')
  })

  it('남의 사연은 담지 않는다', () => {
    const groups = groupMyActivity(demoQuestions, demoAnswers, 'pat-min')

    expect(groups.every((group) => group.question.patientId === 'pat-min')).toBe(true)
  })
})
