import { empathyCount } from '../domain/board'
import { communityReducer, initialCommunityState, initialPrecheck } from './CommunityContext'
import type { Answer, EncounterRequest, Question } from '../domain/types'

const question = { ...initialCommunityState.questions[0], id: 'q-new' } as Question
const answer: Answer = {
  id: 'a-new',
  questionId: 'q-nose',
  doctorId: 'doc-han-ent',
  body: '답변 본문',
  createdAt: '2026-08-09T11:00:00.000Z',
}
const encounter: EncounterRequest = {
  id: 'e-q-nose-doc-han-ent',
  questionId: 'q-nose',
  patientId: initialCommunityState.patientId,
  doctorId: 'doc-han-ent',
  clinicId: 'clinic-han',
  status: 'requested',
  createdAt: '2026-08-09T10:00:00.000Z',
}

describe('communityReducer', () => {
  it('역할을 전환한다', () => {
    const next = communityReducer(initialCommunityState, { type: 'switch-role', role: 'doctor' })

    expect(next.role).toBe('doctor')
  })

  /**
   * 서버를 다시 읽을 때마다 계정 역할로 화면을 되돌리면, 의사 계정으로 환자
   * 화면을 보던 사람이 글 하나 올리는 사이에 의사 화면으로 튕긴다.
   */
  it('직접 고른 화면은 스냅샷이 덮지 않는다', () => {
    const emptySnapshot = {
      questions: [],
      notes: [],
      answers: [],
      empathies: [],
      bookings: [],
      clinics: [],
      doctors: [],
      patients: [],
      encounters: [],
      selfReportedClinics: [],
      privateThreads: [],
      privateMessages: [],
    }

    const switched = communityReducer(initialCommunityState, {
      type: 'switch-role',
      role: 'patient',
    })
    const next = communityReducer(switched, {
      type: 'load-snapshot',
      snapshot: emptySnapshot,
      profileId: 'p-1',
      role: 'doctor',
    })

    expect(next.role).toBe('patient')
  })

  it('직접 고르기 전에는 계정 역할을 따른다', () => {
    const emptySnapshot = {
      questions: [],
      notes: [],
      answers: [],
      empathies: [],
      bookings: [],
      clinics: [],
      doctors: [],
      patients: [],
      encounters: [],
      selfReportedClinics: [],
      privateThreads: [],
      privateMessages: [],
    }

    const next = communityReducer(initialCommunityState, {
      type: 'load-snapshot',
      snapshot: emptySnapshot,
      profileId: 'p-1',
      role: 'doctor',
    })

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
      encounter,
    })
    const twice = communityReducer(once, { type: 'request-encounter', encounter })

    expect(twice.encounters).toHaveLength(1)
  })

  /** 거절은 끝난 이야기다. 같은 의사에게 다시 낼 수 있어야 한다. */
  it('거절된 신청 자리에는 새 신청을 낼 수 있다', () => {
    const declined = communityReducer(
      communityReducer(initialCommunityState, { type: 'request-encounter', encounter }),
      { type: 'set-encounter-status', encounterId: encounter.id, status: 'declined' },
    )
    const again = communityReducer(declined, { type: 'request-encounter', encounter })

    expect(again.encounters).toHaveLength(1)
    expect(again.encounters[0].status).toBe('requested')
  })

  it('의사가 상태를 바꾸면 그 신청만 바뀐다', () => {
    const requested = communityReducer(initialCommunityState, {
      type: 'request-encounter',
      encounter,
    })
    const done = communityReducer(requested, {
      type: 'set-encounter-status',
      encounterId: encounter.id,
      status: 'completed',
    })

    expect(done.encounters[0].status).toBe('completed')
  })

  it('초기화하면 모든 필드가 처음 상태로 돌아간다', () => {
    const dirty = [
      { type: 'switch-role', role: 'doctor' } as const,
      { type: 'publish-question', question } as const,
      { type: 'publish-answer', answer } as const,
      { type: 'toggle-empathy', questionId: 'q-nose' } as const,
      { type: 'request-encounter', encounter } as const,
    ].reduce(communityReducer, initialCommunityState)

    expect(communityReducer(dirty, { type: 'reset' })).toEqual(initialCommunityState)
  })
})
