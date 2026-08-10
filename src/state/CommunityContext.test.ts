import { empathyCount } from '../domain/board'
import { communityReducer, initialCommunityState, initialPrecheck } from './CommunityContext'
import type { Answer, Question } from '../domain/types'

const question = { ...initialCommunityState.questions[0], id: 'q-new' } as Question
const answer: Answer = {
  id: 'a-new',
  questionId: 'q-nose',
  doctorId: 'doc-han-ent',
  body: '답변 본문',
  createdAt: '2026-08-09T11:00:00.000Z',
}

describe('communityReducer', () => {
  it('역할을 전환한다', () => {
    const next = communityReducer(initialCommunityState, { type: 'switch-role', role: 'doctor' })

    expect(next.role).toBe('doctor')
  })

  it('새 질문을 맨 앞에 넣는다', () => {
    const next = communityReducer(initialCommunityState, { type: 'publish-question', question })

    expect(next.questions[0].id).toBe('q-new')
    expect(next.questions).toHaveLength(initialCommunityState.questions.length + 1)
  })

  it('답변을 뒤에 붙인다', () => {
    const next = communityReducer(initialCommunityState, { type: 'publish-answer', answer })

    expect(next.answers.at(-1)?.id).toBe('a-new')
  })

  it('공감을 토글한다', () => {
    const once = communityReducer(initialCommunityState, {
      type: 'toggle-empathy',
      questionId: 'q-nose',
    })
    const twice = communityReducer(once, { type: 'toggle-empathy', questionId: 'q-nose' })

    expect(empathyCount(once.empathies, 'q-nose')).toBe(
      empathyCount(initialCommunityState.empathies, 'q-nose') + 1,
    )
    expect(empathyCount(twice.empathies, 'q-nose')).toBe(
      empathyCount(initialCommunityState.empathies, 'q-nose'),
    )
  })

  it('사전 확인 결과를 담는다', () => {
    const next = communityReducer(initialCommunityState, {
      type: 'complete-precheck',
      precheck: { ...initialPrecheck, completedAt: '2026-08-09T10:00:00.000Z', identityVerified: true, agreedToTerms: true },
    })

    expect(next.precheck.completedAt).toBe('2026-08-09T10:00:00.000Z')
  })

  it('같은 진료 신청을 두 번 담지 않는다', () => {
    const once = communityReducer(initialCommunityState, {
      type: 'request-encounter',
      questionId: 'q-nose',
      doctorId: 'doc-han-ent',
    })
    const twice = communityReducer(once, {
      type: 'request-encounter',
      questionId: 'q-nose',
      doctorId: 'doc-han-ent',
    })

    expect(twice.requestedEncounterIds).toEqual(['q-nose:doc-han-ent'])
  })

  it('초기화하면 모든 필드가 처음 상태로 돌아간다', () => {
    const dirty = [
      { type: 'switch-role', role: 'doctor' } as const,
      { type: 'publish-question', question } as const,
      { type: 'publish-answer', answer } as const,
      { type: 'toggle-empathy', questionId: 'q-nose' } as const,
      { type: 'request-encounter', questionId: 'q-nose', doctorId: 'doc-han-ent' } as const,
    ].reduce(communityReducer, initialCommunityState)

    expect(communityReducer(dirty, { type: 'reset' })).toEqual(initialCommunityState)
  })
})
