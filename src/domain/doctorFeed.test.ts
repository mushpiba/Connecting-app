import { demoQuestions } from '../data/demoQuestions'
import { demoDoctors } from '../data/demoDoctors'
import { settingsFor } from '../data/demoDoctorSettings'
import { directRequests, keywordFeed, notificationDigest } from './doctorFeed'

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
