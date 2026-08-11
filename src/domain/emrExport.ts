import { symptomDurationDays } from './intake'
import type { Answer, Clinic, Doctor, Question, QuestionNote } from './types'

export interface EmrKeyword {
  label: string
  /** 어디서 온 말인지. 환자가 쓴 것과 양식에서 고른 것을 섞지 않는다. */
  source: 'intake' | 'symptom-chip' | 'triage'
}

export interface EmrOrderCandidate {
  kind: 'note' | 'follow-up'
  label: string
  detail: string
}

export interface EmrExport {
  format: 'medivu-emr/v1'
  exportedAt: string
  encounter: {
    questionId: string
    doctorName: string
    clinicName: string
    specialty: string
  }
  patientStatement: {
    title: string
    body: string
    addenda: string[]
    onsetDate: string
    durationDays: number
    course: string
    dailyImpact: string
    painLevel: number | null
  }
  keywords: EmrKeyword[]
  intakeAnswers: { questionId: string; values: string[] }[]
  redFlags: { id: string; label: string; guidance: string }[]
  recordDraft: string
  orders: EmrOrderCandidate[]
  disclaimer: string
}

/**
 * 진료 내용을 EMR이 받을 수 있는 모양으로 옮긴다.
 *
 * 진단명과 처방을 만들지 않는다. 우리가 넘기는 것은 환자가 한 말과 그 말에서
 * 뽑은 키워드, 그리고 의사가 쓴 문장이다. 무엇을 진단하고 무엇을 처방할지는
 * EMR 안에서 의사가 정한다.
 *
 * 키워드는 출처를 함께 넘긴다. 환자가 직접 쓴 말과 양식에서 고른 말이 섞이면
 * 나중에 근거를 되짚을 수 없다.
 */
export function buildEmrExport(
  question: Question,
  notes: QuestionNote[],
  answer: Answer | null,
  doctor: Doctor,
  clinic: Clinic | undefined,
  today: string,
  exportedAt: string,
): EmrExport {
  const keywords: EmrKeyword[] = [
    ...question.selectedSymptoms.map((label) => ({ label, source: 'symptom-chip' as const })),
    ...question.triage.suggestions.flatMap((suggestion) =>
      suggestion.matchedKeywords.map((label) => ({ label, source: 'intake' as const })),
    ),
    ...question.triage.suggestions.map((suggestion) => ({
      label: suggestion.label,
      source: 'triage' as const,
    })),
  ]

  const seen = new Set<string>()
  const uniqueKeywords = keywords.filter((keyword) => {
    const key = `${keyword.source}:${keyword.label}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return {
    format: 'medivu-emr/v1',
    exportedAt,
    encounter: {
      questionId: question.id,
      doctorName: doctor.name,
      clinicName: clinic?.name ?? '',
      specialty: doctor.specialty,
    },
    patientStatement: {
      title: question.title,
      body: question.body,
      addenda: notes.map((note) => note.body),
      onsetDate: question.onsetDate,
      durationDays: symptomDurationDays(question.onsetDate, today),
      course: question.course,
      dailyImpact: question.dailyImpact,
      painLevel: question.painLevel,
    },
    keywords: uniqueKeywords,
    intakeAnswers: question.intakeAnswers,
    redFlags: question.triage.redFlags.map((flag) => ({
      id: flag.id,
      label: flag.label,
      guidance: flag.guidance,
    })),
    recordDraft: answer?.body ?? '',
    orders: [
      {
        kind: 'note',
        label: '비대면 상담 기록',
        detail: '커뮤니티 사연과 답변을 근거로 작성한 초안. 의사가 확인하고 확정한다.',
      },
      {
        kind: 'follow-up',
        label: '경과 확인',
        detail: '증상이 나빠지거나 새 증상이 생기면 대면 진료로 전환한다.',
      },
    ],
    disclaimer:
      '가상 데이터로 만든 시연용 내보내기입니다. 진단명과 처방을 담지 않으며 실제 EMR로 전송되지 않습니다.',
  }
}
