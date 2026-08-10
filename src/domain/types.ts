export type Specialty =
  | 'internal-medicine'
  | 'family-medicine'
  | 'otolaryngology'
  | 'dermatology'
  | 'orthopedics'
  | 'psychiatry'
  | 'ophthalmology'
  | 'obgyn'
  | 'pediatrics'
  | 'urology'

export type ClinicLevel = 'clinic' | 'hospital'

export type EligibilityStatus = 'eligible' | 'conditional' | 'ineligible'

export type MedicationRestriction = 'allowed' | 'conditional' | 'prohibited'

export type AppRole = 'patient' | 'doctor'

/** 증상 분류 결과. 진단명이 아니라 진료과만 다룬다. */
export interface TriageSuggestion {
  specialty: Specialty
  label: string
  matchedKeywords: string[]
  score: number
}

export interface RedFlag {
  id: string
  label: string
  guidance: string
  matchedKeywords: string[]
}

export interface TriageResult {
  suggestions: TriageSuggestion[]
  redFlags: RedFlag[]
  ruleSetName: string
  ruleSetAsOf: string
}

export interface SpecialtyRule {
  specialty: Specialty
  label: string
  keywords: string[]
}

export interface RedFlagRule {
  id: string
  label: string
  guidance: string
  keywords: string[]
}

export interface TriageRuleSet {
  name: string
  asOf: string
  specialties: SpecialtyRule[]
  redFlags: RedFlagRule[]
}

/** 비대면 진료 대상자 판정에 쓰는 파라미터. 하위법령 확정 전이므로 전부 값으로 뺀다. */
export interface EligibilityParams {
  /** 재진 인정기간(개월). 현행 6개월, 제도화 후 복지부령 위임. */
  revisitValidMonths: number
  /** 초진 처방일수 상한(일). 7일 검토 중. */
  firstVisitMaxPrescriptionDays: number
  /** 의료기관 월 비대면 진료 비율 상한. */
  monthlyClinicRatioCap: number
  /** 환자 1인당 월 비대면 청구 상한(회). */
  monthlyVisitCapPerPatient: number
  /** 초진 시 환자 거주지와 의료기관 동일 지역 요구 여부. */
  requireSameRegionForFirstVisit: boolean
}

export interface EligibilityRuleSet {
  name: string
  source: string
  asOf: string
  evidenceUrl: string
  params: EligibilityParams
}

export type EligibilityException =
  | 'none'
  | 'rare-disease'
  | 'type1-diabetes'
  | 'post-op-followup'
  | 'correctional-facility'

export interface PriorVisit {
  clinicId: string
  /** ISO date. 환자 자기신고 값이며 의사가 차트로 확인해야 한다. */
  visitedOn: string
  selfReported: true
}

export interface ClinicSnapshot {
  id: string
  name: string
  level: ClinicLevel
  region: string
  telemedicineEnabled: boolean
  /** 이번 달 전체 진료 중 비대면 비율(0~1). */
  monthlyTelemedicineRatio: number
}

export interface EligibilityContext {
  identityVerified: boolean
  priorVisit: PriorVisit | null
  sameSymptoms: boolean
  patientRegion: string
  patientMonthlyTelemedicineCount: number
  exception: EligibilityException
  clinic: ClinicSnapshot
  /** 판정 기준일. ISO date. */
  today: string
}

export type CheckOutcome = 'passed' | 'failed' | 'not-applicable'

export interface EligibilityCheck {
  id: string
  label: string
  outcome: CheckOutcome
  detail: string
}

export interface EligibilityResult {
  status: EligibilityStatus
  summary: string
  checks: EligibilityCheck[]
  failedCheckIds: string[]
  isFirstVisit: boolean
  ruleSetName: string
  ruleSetAsOf: string
  evidenceUrl: string
}

export interface MedicationDecision {
  medicationId: string
  name: string
  status: MedicationRestriction
  reason: string
  category: string
  source: string
  asOf: string
  evidenceUrl: string
}

export interface MedicationRuleSet {
  source: string
  asOf: string
  evidenceUrl: string
  medications: Record<
    string,
    Omit<MedicationDecision, 'source' | 'asOf' | 'evidenceUrl'>
  >
}

export interface Clinic {
  id: string
  name: string
  level: ClinicLevel
  region: string
  address: string
  phone: string
  /** 각 병원이 직접 운영하는 예약 페이지. 우리가 예약을 성사시키지 않는다. */
  bookingUrl: string
  telemedicineEnabled: boolean
  monthlyTelemedicineRatio: number
}

export interface Doctor {
  id: string
  name: string
  clinicId: string
  specialty: Specialty
  licenseNumber: string
  licenseVerified: boolean
  /** 의사가 직접 등록한 관심 키워드. 유료 우선권 아님. */
  keywords: string[]
  notificationsEnabled: boolean
  bio: string
}

export interface Patient {
  id: string
  displayName: string
  region: string
  monthlyTelemedicineCount: number
}

export interface Question {
  id: string
  patientId: string
  title: string
  body: string
  createdAt: string
  triage: TriageResult
  /** 환자가 스스로 밝힌 진료 이력. 해당 의원 소속 의사에게만 노출한다. */
  priorVisit: PriorVisit | null
  sameSymptoms: boolean
}

export interface Answer {
  id: string
  questionId: string
  doctorId: string
  body: string
  createdAt: string
}

export type EncounterStatus = 'booked' | 'in-progress' | 'completed'

export interface TranscriptLine {
  id: string
  speaker: 'patient' | 'doctor'
  text: string
  at: string
}

export interface PrescriptionOrder {
  medicationId: string
  name: string
  dose: string
  instruction: string
}

export interface Encounter {
  id: string
  answerId: string
  questionId: string
  patientId: string
  doctorId: string
  clinicId: string
  scheduledAt: string
  status: EncounterStatus
  eligibility: EligibilityResult
  transcript: TranscriptLine[]
  orders: PrescriptionOrder[]
  soapDraft: string
}

/** 대면으로 분기됐을 때 환자에게 주는 안내와 의사 기록용 문구. */
export interface ReferralNotice {
  patientMessage: string
  recordStatement: string
  failedReasons: string[]
  ruleSetName: string
  ruleSetAsOf: string
  evidenceUrl: string
}
