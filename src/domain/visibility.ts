import { canSeePriorVisit, suggestedSpecialties } from './routing'
import type { Doctor, Question } from './types'

/**
 * 글 자체가 이 의사에게 보이는가.
 *
 * canSeePriorVisit과 구분해야 한다. 그쪽은 이미 보이는 글 안의 진료 이력 줄이
 * 보이는지를 판단한다. 공개 글이라도 진료 이력 줄은 그 의료기관 의사에게만 보인다.
 */
export function canDoctorSeeQuestion(doctor: Doctor, question: Question): boolean {
  if (question.visibility === 'public') return true
  if (question.visibility === 'specialty-only') {
    return suggestedSpecialties(question).has(doctor.specialty)
  }

  return canSeePriorVisit(doctor, question)
}

/** 입력 순서를 바꾸지 않는다. 정렬은 호출부가 정한다. */
export function listVisibleQuestions(doctor: Doctor, questions: Question[]): Question[] {
  return questions.filter((question) => canDoctorSeeQuestion(doctor, question))
}

/** 공개 게시판에 올라가는 글인가. 비공개 글은 순위 집계에도 넣지 않는다. */
export function isPubliclyListed(question: Question): boolean {
  return question.visibility === 'public'
}
