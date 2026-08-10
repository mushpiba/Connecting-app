import type { Doctor, Question, Specialty } from './types'

export type MatchReason = 'specialty' | 'keyword'

/** 질문이 분류된 진료과 집합. 매칭과 공개 범위 판정이 같은 정의를 쓴다. */
export function suggestedSpecialties(question: Question): Set<Specialty> {
  return new Set(question.triage.suggestions.map((item) => item.specialty))
}

export interface QuestionMatch {
  doctorId: string
  reasons: MatchReason[]
  matchedKeywords: string[]
  notify: boolean
}

/**
 * 질문을 어느 의사에게 보여줄지 정한다.
 *
 * 이 함수는 과금이나 광고 정보를 인자로 받지 않는다. 노출 우선권을 파는 순간
 * 성사 연동으로 해석될 수 있어 구조적으로 불가능하게 두었다.
 * 정렬도 하지 않는다. 호출부가 안정된 순서로 그대로 쓴다.
 */
export function matchDoctors(question: Question, doctors: Doctor[]): QuestionMatch[] {
  const specialties = suggestedSpecialties(question)
  const haystack = `${question.title} ${question.body}`

  return doctors
    .filter((doctor) => doctor.licenseVerified)
    .map((doctor) => {
      const reasons: MatchReason[] = []
      if (specialties.has(doctor.specialty)) reasons.push('specialty')

      const matchedKeywords = doctor.keywords.filter((keyword) => haystack.includes(keyword))
      if (matchedKeywords.length > 0) reasons.push('keyword')

      return {
        doctorId: doctor.id,
        reasons,
        matchedKeywords,
        notify: reasons.length > 0 && doctor.notificationsEnabled,
      }
    })
    .filter((match) => match.reasons.length > 0)
}

/**
 * 환자가 스스로 밝힌 진료 이력은 그 의료기관 소속 의사에게만 보여준다.
 * 공개 게시판 본문에는 담지 않는다.
 */
export function canSeePriorVisit(doctor: Doctor, question: Question): boolean {
  return question.priorVisit !== null && question.priorVisit.clinicId === doctor.clinicId
}
