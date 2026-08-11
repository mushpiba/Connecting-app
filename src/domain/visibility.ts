import { canSeePriorVisit, suggestedSpecialties } from './routing'
import type { Doctor, Question } from './types'

/**
 * 글 자체가 이 의사에게 보이는가.
 *
 * canSeePriorVisit과 구분해야 한다. 그쪽은 이미 보이는 글 안의 진료 이력 줄이
 * 보이는지를 판단한다. 공개 글이라도 진료 이력 줄은 그 의료기관 의사에게만 보인다.
 */
export function canDoctorSeeQuestion(doctor: Doctor, question: Question): boolean {
  if (!doctor.licenseVerified) return false
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

/**
 * 답변을 쓸 수 있는가. 면허 검증을 마친 의사만 답변한다.
 *
 * 화면에서만 막으면 경로를 직접 열었을 때 뚫린다. 판정을 도메인에 둔다.
 */
export function canDoctorAnswer(doctor: Doctor, question: Question): boolean {
  return doctor.licenseVerified && canDoctorSeeQuestion(doctor, question)
}

/** 공개 게시판에 올라가는 글인가. 비공개 글은 순위 집계에도 넣지 않는다. */
export function isPubliclyListed(question: Question): boolean {
  return question.visibility === 'public'
}
