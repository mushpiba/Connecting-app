import { matchDoctors } from './routing'
import { canDoctorSeeQuestion } from './visibility'
import type { BookingRequest, Doctor, DoctorSettings, Question } from './types'

export type FeedReason = 'specialty' | 'keyword'

export interface FeedItem {
  question: Question
  reasons: FeedReason[]
  matchedKeywords: string[]
}

/**
 * 나를 지목해서 온 것.
 *
 * 환자가 우리 의료기관에서 진료받았다고 밝혀 그 소속 의사에게만 연 사연과,
 * 나에게 온 예약 요청이 여기 모인다. 이건 답을 기다리는 사람이 정해져 있다.
 */
export function directRequests(
  doctor: Doctor,
  questions: Question[],
  bookings: BookingRequest[],
): { questions: Question[]; bookings: BookingRequest[] } {
  return {
    questions: questions.filter(
      (question) =>
        question.visibility === 'prior-clinic-only' && canDoctorSeeQuestion(doctor, question),
    ),
    bookings: bookings.filter((booking) => booking.doctorId === doctor.id),
  }
}

/**
 * 진료과나 등록한 키워드로 걸린 사연.
 *
 * 지목받은 것이 아니라 내가 볼 만해서 올라온 것이다. 키워드는 의사가 직접
 * 정하며 노출 우선권을 사는 수단이 아니다. 정렬도 하지 않는다.
 */
export function keywordFeed(
  doctor: Doctor,
  settings: DoctorSettings,
  questions: Question[],
): FeedItem[] {
  const withKeywords: Doctor = { ...doctor, keywords: settings.keywords }

  return questions
    .filter((question) => question.visibility !== 'prior-clinic-only')
    .flatMap((question) => {
      const match = matchDoctors(question, [withKeywords])[0]
      if (!match) return []
      return [{ question, reasons: match.reasons, matchedKeywords: match.matchedKeywords }]
    })
}

export interface NotificationDigest {
  sent: FeedItem[]
  heldBack: number
  limit: number
}

/**
 * 하루에 보낼 알림을 상한까지만 자른다.
 *
 * 상한을 넘긴 것은 버리지 않고 몇 건이 남았는지만 알린다. 알림이 쏟아지면
 * 의사는 알림 자체를 꺼 버리고, 그러면 급한 것도 놓친다.
 */
export function notificationDigest(feed: FeedItem[], limit: number): NotificationDigest {
  return {
    sent: feed.slice(0, limit),
    heldBack: Math.max(0, feed.length - limit),
    limit,
  }
}
