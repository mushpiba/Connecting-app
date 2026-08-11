import type {
  Answer,
  BookingRequest,
  Clinic,
  Doctor,
  Empathy,
  Patient,
  Question,
  Specialty,
  TriageResult,
} from '../domain/types'

/** profiles 한 줄. 환자와 의사가 같은 표에 있다. */
export interface ProfileRow {
  id: string
  display_name: string
  role: 'patient' | 'doctor'
  region: string
  license_verified: boolean
  clinic_id: string | null
  specialty: string | null
  template_id: string | null
}

export interface QuestionRow {
  id: string
  author_id: string
  title: string
  body: string
  visibility: Question['visibility']
  onset_date: string
  course: Question['course']
  daily_impact: Question['dailyImpact']
  tried_remedies: Question['triedRemedies']
  body_areas: Question['bodyAreas']
  triage: TriageResult
  prior_clinic_id: string | null
  prior_visited_on: string | null
  same_symptoms: boolean
  selected_symptoms: string[]
  pain_level: number | null
  intake_answers: Question['intakeAnswers']
  created_at: string
}

export interface AnswerRow {
  id: string
  question_id: string
  doctor_id: string
  body: string
  created_at: string
}

export interface EmpathyRow {
  question_id: string
  patient_id: string
  created_at: string
}

export interface BookingRow {
  id: string
  patient_id: string
  doctor_id: string
  clinic_id: string
  visit_date: string
  visit_time: string
  document_types: string[]
  created_at: string
}

export interface ClinicRow {
  id: string
  name: string
  level: Clinic['level']
  region: string
  address: string
  phone: string
  booking_url: string
  telemedicine_enabled: boolean
  monthly_telemedicine_ratio: number
  landmark: string
  lunch_break: string | null
  hours: Clinic['hours']
}

export function toQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    patientId: row.author_id,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    triage: row.triage,
    priorVisit:
      row.prior_clinic_id && row.prior_visited_on
        ? { clinicId: row.prior_clinic_id, visitedOn: row.prior_visited_on, selfReported: true }
        : null,
    sameSymptoms: row.same_symptoms,
    visibility: row.visibility,
    onsetDate: row.onset_date,
    course: row.course,
    dailyImpact: row.daily_impact,
    triedRemedies: row.tried_remedies,
    bodyAreas: row.body_areas,
    selectedSymptoms: row.selected_symptoms ?? [],
    painLevel: row.pain_level,
    intakeAnswers: row.intake_answers ?? [],
  }
}

/** 저장할 때는 진료과를 따로 뽑아 둔다. RLS 정책이 그 열로 판정한다. */
export function toQuestionInsert(question: Question, authorId: string) {
  return {
    author_id: authorId,
    title: question.title,
    body: question.body,
    visibility: question.visibility,
    onset_date: question.onsetDate,
    course: question.course,
    daily_impact: question.dailyImpact,
    tried_remedies: question.triedRemedies,
    body_areas: question.bodyAreas,
    selected_symptoms: question.selectedSymptoms,
    pain_level: question.painLevel,
    intake_answers: question.intakeAnswers,
    triage: question.triage,
    specialties: question.triage.suggestions.map((item) => item.specialty),
    prior_clinic_id: question.priorVisit?.clinicId ?? null,
    prior_visited_on: question.priorVisit?.visitedOn ?? null,
    same_symptoms: question.sameSymptoms,
  }
}

export function toAnswer(row: AnswerRow): Answer {
  return {
    id: row.id,
    questionId: row.question_id,
    doctorId: row.doctor_id,
    body: row.body,
    createdAt: row.created_at,
  }
}

export function toEmpathy(row: EmpathyRow): Empathy {
  return { questionId: row.question_id, patientId: row.patient_id, at: row.created_at }
}

export function toBooking(row: BookingRow): BookingRequest {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    clinicId: row.clinic_id,
    date: row.visit_date,
    time: row.visit_time,
    requestedAt: row.created_at,
    documentTypes: (row.document_types ?? []) as BookingRequest['documentTypes'],
  }
}

export function toClinic(row: ClinicRow): Clinic {
  return {
    id: row.id,
    name: row.name,
    level: row.level,
    region: row.region,
    address: row.address,
    phone: row.phone,
    bookingUrl: row.booking_url,
    telemedicineEnabled: row.telemedicine_enabled,
    monthlyTelemedicineRatio: Number(row.monthly_telemedicine_ratio),
    landmark: row.landmark,
    hours: row.hours,
    lunchBreak: row.lunch_break,
  }
}

export function toPatient(row: ProfileRow): Patient {
  return {
    id: row.id,
    displayName: row.display_name,
    region: row.region,
    monthlyTelemedicineCount: 0,
  }
}

/**
 * 계정에는 자기소개나 약력이 없다. 준비된 프로필을 골라 들어왔으면 그 내용을
 * 채워 넣고, 아니면 빈 자리로 둔다.
 */
export function toDoctor(row: ProfileRow, template?: Doctor): Doctor {
  return {
    id: row.id,
    name: row.display_name,
    clinicId: row.clinic_id ?? template?.clinicId ?? '',
    specialty: (row.specialty ?? template?.specialty ?? 'family-medicine') as Specialty,
    licenseNumber: '',
    licenseVerified: row.license_verified,
    keywords: template?.keywords ?? [],
    notificationsEnabled: true,
    bio: template?.bio ?? '',
    consultStyle: template?.consultStyle ?? '',
    career: template?.career ?? [],
    templateId: row.template_id ?? undefined,
  }
}
