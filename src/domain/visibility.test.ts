import { triageRuleSet } from '../data/rules/triageRules'
import { canSeePriorVisit } from './routing'
import { triage } from './triage'
import { canDoctorAnswer, canDoctorSeeQuestion, listVisibleQuestions } from './visibility'
import type { Doctor, PostVisibility, Question } from './types'

function doctor(overrides: Partial<Doctor> = {}): Doctor {
  return {
    id: 'doc-1',
    name: '김이비',
    clinicId: 'clinic-han',
    specialty: 'otolaryngology',
    licenseNumber: '00000',
    licenseVerified: true,
    keywords: [],
    notificationsEnabled: true,
    licenseType: '의사',
    ...overrides,
  }
}

function question(overrides: Partial<Question> = {}): Question {
  const body = '콧물이랑 코막힘이 2주째 이어집니다.'
  return {
    id: 'q-1',
    patientId: 'pat-1',
    title: '콧물과 코막힘',
    body,
    createdAt: '2026-08-09T09:00:00.000Z',
    triage: triage(body, triageRuleSet),
    priorVisit: { clinicId: 'clinic-han', visitedOn: '2026-06-02', selfReported: true },
    sameSymptoms: true,
    visibility: 'public' as PostVisibility,
    onsetDate: '2026-07-27',
    course: 'unchanged',
    dailyImpact: 'mild',
    triedRemedies: ['otc'],
    bodyAreas: ['ent'],
    selectedSymptoms: [],
    painLevel: null,
    intakeAnswers: [],
    ...overrides,
  }
}

describe('canDoctorSeeQuestion', () => {
  it('공개 글은 진료과가 달라도 보인다', () => {
    expect(canDoctorSeeQuestion(doctor({ specialty: 'obgyn' }), question())).toBe(true)
  })

  it('공개 글은 진료 이력이 없어도 보인다', () => {
    expect(
      canDoctorSeeQuestion(doctor({ clinicId: 'clinic-other' }), question({ priorVisit: null })),
    ).toBe(true)
  })

  it('진료과 한정 글은 분류된 과의 의사에게만 보인다', () => {
    expect(canDoctorSeeQuestion(doctor(), question({ visibility: 'specialty-only' }))).toBe(true)
  })

  it('진료과 한정 글은 다른 과 의사에게 보이지 않는다', () => {
    expect(
      canDoctorSeeQuestion(
        doctor({ specialty: 'obgyn' }),
        question({ visibility: 'specialty-only' }),
      ),
    ).toBe(false)
  })

  it('진료 이력 한정 글은 그 의료기관 의사에게만 보인다', () => {
    expect(canDoctorSeeQuestion(doctor(), question({ visibility: 'prior-clinic-only' }))).toBe(
      true,
    )
  })

  it('진료 이력 한정 글은 다른 의료기관 의사에게 보이지 않는다', () => {
    expect(
      canDoctorSeeQuestion(
        doctor({ clinicId: 'clinic-other' }),
        question({ visibility: 'prior-clinic-only' }),
      ),
    ).toBe(false)
  })

  it('진료 이력 한정인데 이력을 밝히지 않았으면 아무에게도 보이지 않는다', () => {
    expect(
      canDoctorSeeQuestion(doctor(), question({ visibility: 'prior-clinic-only', priorVisit: null })),
    ).toBe(false)
  })

  it('공개 글이어도 진료 이력 줄은 해당 의료기관 의사에게만 보인다', () => {
    const post = question()

    expect(canDoctorSeeQuestion(doctor({ clinicId: 'clinic-other' }), post)).toBe(true)
    expect(canSeePriorVisit(doctor({ clinicId: 'clinic-other' }), post)).toBe(false)
    expect(canSeePriorVisit(doctor(), post)).toBe(true)
  })
})

describe('listVisibleQuestions', () => {
  it('보이는 글만 남긴다', () => {
    const questions = [
      question({ id: 'q-a' }),
      question({ id: 'q-b', visibility: 'prior-clinic-only' }),
      question({ id: 'q-c' }),
    ]

    expect(
      listVisibleQuestions(doctor({ clinicId: 'clinic-other' }), questions).map((item) => item.id),
    ).toEqual(['q-a', 'q-c'])
  })

  it('입력 순서를 바꾸지 않는다', () => {
    const questions = [question({ id: 'q-c' }), question({ id: 'q-a' }), question({ id: 'q-b' })]

    expect(listVisibleQuestions(doctor(), questions).map((item) => item.id)).toEqual([
      'q-c',
      'q-a',
      'q-b',
    ])
  })
})

describe('canDoctorAnswer', () => {
  it('면허를 검증한 의사는 답변할 수 있다', () => {
    expect(canDoctorAnswer(doctor(), question())).toBe(true)
  })

  it('면허 미검증 의사는 공개 글도 볼 수 없고 답변할 수 없다', () => {
    const pending = doctor({ licenseVerified: false })

    expect(canDoctorSeeQuestion(pending, question())).toBe(false)
    expect(canDoctorAnswer(pending, question())).toBe(false)
  })

  it('면허를 검증해도 안 보이는 글에는 답변할 수 없다', () => {
    expect(
      canDoctorAnswer(
        doctor({ clinicId: 'clinic-other' }),
        question({ visibility: 'prior-clinic-only' }),
      ),
    ).toBe(false)
  })
})
