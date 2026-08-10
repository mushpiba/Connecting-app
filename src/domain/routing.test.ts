import { triageRuleSet } from '../data/rules/triageRules'
import { canSeePriorVisit, matchDoctors } from './routing'
import { triage } from './triage'
import type { Doctor, Question } from './types'

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
    bio: '',
    consultStyle: '',
    career: [],
    ...overrides,
  }
}

const question: Question = {
  id: 'q-1',
  patientId: 'pat-1',
  title: '콧물과 코막힘',
  body: '콧물이랑 코막힘이 2주째 이어집니다. 잠도 잘 못 잡니다.',
  createdAt: '2026-08-09T09:00:00.000Z',
  triage: triage('콧물이랑 코막힘이 2주째 이어집니다. 잠도 잘 못 잡니다.', triageRuleSet),
  priorVisit: { clinicId: 'clinic-han', visitedOn: '2026-06-02', selfReported: true },
  sameSymptoms: true,
  visibility: 'public',
  onsetDate: '2026-07-27',
  course: 'unchanged',
  dailyImpact: 'disruptive',
  triedRemedies: ['otc'],
  bodyAreas: ['ent'],
}

describe('matchDoctors', () => {
  it('분류된 진료과가 같은 의사를 매치한다', () => {
    const matches = matchDoctors(question, [doctor()])

    expect(matches[0].reasons).toContain('specialty')
  })

  it('과가 달라도 등록한 키워드가 걸리면 매치한다', () => {
    const matches = matchDoctors(question, [
      doctor({ id: 'doc-2', specialty: 'psychiatry', keywords: ['잠'] }),
    ])

    expect(matches[0].reasons).toEqual(['keyword'])
    expect(matches[0].matchedKeywords).toEqual(['잠'])
  })

  it('과도 키워드도 안 맞으면 매치하지 않는다', () => {
    const matches = matchDoctors(question, [
      doctor({ id: 'doc-3', specialty: 'obgyn', keywords: ['생리'] }),
    ])

    expect(matches).toEqual([])
  })

  it('면허 미검증 의사는 제외한다', () => {
    const matches = matchDoctors(question, [doctor({ licenseVerified: false })])

    expect(matches).toEqual([])
  })

  it('알림을 꺼둔 의사는 매치는 되지만 알림은 보내지 않는다', () => {
    const matches = matchDoctors(question, [doctor({ notificationsEnabled: false })])

    expect(matches).toHaveLength(1)
    expect(matches[0].notify).toBe(false)
  })

  it('입력 순서를 바꾸지 않는다', () => {
    const doctors = [
      doctor({ id: 'doc-b' }),
      doctor({ id: 'doc-a' }),
      doctor({ id: 'doc-c' }),
    ]

    expect(matchDoctors(question, doctors).map((item) => item.doctorId)).toEqual([
      'doc-b',
      'doc-a',
      'doc-c',
    ])
  })
})

describe('canSeePriorVisit', () => {
  it('같은 의료기관 소속 의사에게만 보여준다', () => {
    expect(canSeePriorVisit(doctor(), question)).toBe(true)
    expect(canSeePriorVisit(doctor({ clinicId: 'clinic-other' }), question)).toBe(false)
  })

  it('환자가 진료 이력을 밝히지 않았으면 아무에게도 안 보여준다', () => {
    expect(canSeePriorVisit(doctor(), { ...question, priorVisit: null })).toBe(false)
  })
})
