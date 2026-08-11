import { demoQuestions } from '../data/demoQuestions'
import { demoDoctors } from '../data/demoDoctors'
import { settingsFor } from '../data/demoDoctorSettings'
import { applyReview, directRequests, keywordFeed, notificationDigest, urgentFirst } from './doctorFeed'

const ent = demoDoctors.find((doctor) => doctor.id === 'doc-han-ent')!
const derm = demoDoctors.find((doctor) => doctor.id === 'doc-skin-derm')!
const pending = demoDoctors.find((doctor) => doctor.id === 'doc-pending')!

describe('directRequests', () => {
  it('우리 의료기관을 밝힌 사연만 담는다', () => {
    const result = directRequests(ent, demoQuestions, [])

    expect(result.questions.map((question) => question.id)).toEqual(['q-followup'])
  })

  it('다른 의료기관 의사에게는 오지 않는다', () => {
    expect(directRequests(derm, demoQuestions, []).questions).toEqual([])
  })

  it('면허 미검증 의사에게는 오지 않는다', () => {
    expect(directRequests(pending, demoQuestions, []).questions).toEqual([])
  })

  it('나에게 온 예약만 담는다', () => {
    const bookings = [
      { id: 'b1', doctorId: 'doc-han-ent', clinicId: 'clinic-han', date: '2026-08-11', time: '10:30', requestedAt: '', documentTypes: [] },
      { id: 'b2', doctorId: 'doc-skin-derm', clinicId: 'clinic-skin', date: '2026-08-11', time: '11:00', requestedAt: '', documentTypes: [] },
    ]

    expect(directRequests(ent, demoQuestions, bookings).bookings.map((item) => item.id)).toEqual(['b1'])
  })
})

describe('keywordFeed', () => {
  it('진료과가 맞으면 올라온다', () => {
    const feed = keywordFeed(ent, settingsFor(ent.id), demoQuestions)

    expect(feed.map((item) => item.question.id)).toContain('q-nose')
  })

  it('지목받은 사연은 여기 담지 않는다', () => {
    const feed = keywordFeed(ent, settingsFor(ent.id), demoQuestions)

    expect(feed.map((item) => item.question.id)).not.toContain('q-followup')
  })

  it('설정한 키워드로도 걸린다', () => {
    const feed = keywordFeed(
      derm,
      { ...settingsFor(derm.id), keywords: ['두드러기'] },
      demoQuestions,
    )
    const rash = feed.find((item) => item.question.id === 'q-rash')

    expect(rash?.reasons).toContain('keyword')
    expect(rash?.matchedKeywords).toContain('두드러기')
  })

  it('키워드를 비우면 진료과로만 걸린다', () => {
    const feed = keywordFeed(derm, { ...settingsFor(derm.id), keywords: [] }, demoQuestions)

    expect(feed.every((item) => item.reasons.includes('specialty'))).toBe(true)
  })
})

describe('notificationDigest', () => {
  const feed = keywordFeed(ent, settingsFor(ent.id), demoQuestions)

  it('상한까지만 보낸다', () => {
    expect(notificationDigest(feed, 1).sent).toHaveLength(1)
  })

  it('남은 건수를 알려준다', () => {
    const digest = notificationDigest(feed, 1)

    expect(digest.heldBack).toBe(feed.length - 1)
  })

  it('상한이 넉넉하면 남는 것이 없다', () => {
    expect(notificationDigest(feed, 100).heldBack).toBe(0)
  })
})

describe('urgentFirst', () => {
  /** 응급 신호가 걸린 사연은 어느 진료과에도 안 걸릴 수 있어 직접 만든다. */
  const feed = ['q-nose', 'q-knee', 'q-chest'].map((id) => ({
    question: demoQuestions.find((question) => question.id === id)!,
    reasons: ['specialty' as const],
    matchedKeywords: [],
  }))

  it('응급 신호가 걸린 사연을 맨 위로 올린다', () => {
    const sorted = urgentFirst(feed)

    expect(sorted[0].question.triage.redFlags.length).toBeGreaterThan(0)
  })

  it('나머지 순서는 그대로 둔다', () => {
    const sorted = urgentFirst(feed)
    const rest = sorted.filter((item) => item.question.triage.redFlags.length === 0)
    const original = feed.filter((item) => item.question.triage.redFlags.length === 0)

    expect(rest.map((item) => item.question.id)).toEqual(original.map((item) => item.question.id))
  })
})

describe('applyReview', () => {
  const feed = keywordFeed(ent, settingsFor(ent.id), demoQuestions)

  it('보류한 사연을 아래로 내린다', () => {
    const first = feed[0].question.id
    const sorted = applyReview(feed, (id) => (id === first ? 'held' : 'new'))

    expect(sorted.at(-1)?.question.id).toBe(first)
  })

  it('보류해도 목록에서 사라지지 않는다', () => {
    const sorted = applyReview(feed, () => 'held')

    expect(sorted).toHaveLength(feed.length)
  })
})
