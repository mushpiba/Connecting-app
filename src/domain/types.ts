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

/** 질문 공개 범위. 환자가 작성할 때 고른다. */
export type PostVisibility = 'public' | 'specialty-only' | 'prior-clinic-only'

/** 문진 양식의 부위 선택지. 진단 부위가 아니라 어느 과로 갈지 좁히는 용도다. */
export type BodyArea =
  | 'ent'
  | 'eye'
  | 'skin'
  | 'digestive'
  | 'musculoskeletal'
  | 'mind'
  | 'urinary'
  | 'womens'
  | 'child'
  | 'general'
  | 'unsure'

export type SymptomCourse = 'worsening' | 'unchanged' | 'fluctuating' | 'improving'

/** 중증도 지수 대신 일상생활 지장 정도로만 받는다. 임상 척도를 만들지 않는다. */
export type DailyImpact = 'none' | 'mild' | 'disruptive' | 'severe'

export type TriedRemedy = 'otc' | 'clinic' | 'rest' | 'none'

/**
 * 환자가 스스로 고른 통증 정도. 우리가 이 숫자로 무엇도 판정하지 않는다.
 * 의사에게 그대로 전달만 한다. null이면 고르지 않은 것이다.
 */
export type PainLevel = number | null

/** 문진 문항 하나에 대한 답. 값은 항상 배열이라 단일과 복수를 같이 다룬다. */
export interface IntakeAnswer {
  questionId: string
  values: string[]
}

/** 진료 후 발급받을 서류. 발급은 병원이 한다. */
export type DocumentType = 'visit-certificate' | 'receipt' | 'itemized-receipt'

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
  /** 후보 최대 개수. */
  maxSuggestions: number
  /** 선두 점수 대비 이 비율을 넘는 후보만 남긴다. 0.5면 절반 초과. */
  relativeScoreFloor: number
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

export type Weekday = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'

/** 요일별 진료 시간. open이 null이면 휴진이다. */
export interface ClinicHours {
  weekday: Weekday
  open: string | null
  close: string | null
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
  /** 길찾기용 한 줄 안내. 실제 지도 API를 부르지 않는다. */
  landmark: string
  hours: ClinicHours[]
  lunchBreak: string | null
}

export interface ClinicSchedule {
  weekday: Weekday
  today: ClinicHours
  isOpenToday: boolean
  /** 오늘 휴진일 때 다음 진료일. 오늘 진료하면 null. */
  nextOpen: ClinicHours | null
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
  /** 진료 방법. 어떻게 진료하는지 의사가 직접 쓴 한 문단. */
  consultStyle: string
  career: string[]
  /** 준비된 프로필을 골라 들어왔으면 그 id. 설정 기본값을 여기서 찾는다. */
  templateId?: string
}

/** 의사가 직접 정하는 값들. 프로필과 알림과 비대면 운영이 한 덩어리다. */
export interface DoctorSettings {
  doctorId: string
  /** 진료 보고 싶은 사례. 이 말이 들어간 사연이 사연 모음에 올라온다. */
  keywords: string[]
  /** 하루에 받을 사연 알림 최대 개수. 넘치면 알림을 보내지 않는다. */
  dailyNotificationLimit: number
  telemedicineEnabled: boolean
  /** 한 건에 잡는 시간(분). */
  slotMinutes: number
  /** 초진 비대면을 받을지. 재진만 받는 의사가 많다. */
  acceptsFirstVisit: boolean
  /** 비대면을 여는 시간대. 진료시간과 별개로 의사가 정한다. */
  telemedicineBands: SlotBand[]
  /** 환자에게 보이는 한 줄. 무엇을 준비해 오면 좋은지 적는다. */
  telemedicineNote: string
}

export type SlotBand = 'dawn' | 'morning' | 'afternoon' | 'night'

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
  visibility: PostVisibility
  onsetDate: string
  course: SymptomCourse
  dailyImpact: DailyImpact
  triedRemedies: TriedRemedy[]
  bodyAreas: BodyArea[]
  /** 칩으로 고른 증상. 본문에도 담기지만 목록으로도 남긴다. */
  selectedSymptoms: string[]
  painLevel: PainLevel
  intakeAnswers: IntakeAnswer[]
}

/**
 * 사연에 덧붙인 말.
 *
 * 사연은 등록하면 고칠 수 없다. 지나간 증상 설명이 조용히 바뀌면 그 위에 달린
 * 답변이 무엇을 보고 쓴 것인지 알 수 없어진다. 대신 덧붙인다.
 */
export interface QuestionNote {
  id: string
  questionId: string
  authorId: string
  body: string
  createdAt: string
}

export interface Answer {
  id: string
  questionId: string
  doctorId: string
  body: string
  createdAt: string
}

/**
 * 공감 기록. 누적 카운터가 아니라 개별 기록으로 둔다.
 * 카운터로는 "이번 주에 몇 개인가"에 답할 수 없다.
 */
export interface Empathy {
  questionId: string
  patientId: string
  at: string
}

export interface WeeklyRank {
  questionId: string
  weeklyCount: number
  totalCount: number
  isHot: boolean
}

export interface BoardRuleSet {
  name: string
  asOf: string
  /** 주간 집계 창 길이(일). */
  windowDays: number
  /** 상단 고정 최대 개수. */
  hotLimit: number
  /** 고정되려면 필요한 최소 주간 공감 수. */
  minWeeklyCount: number
}

/** 문진 양식 입력값. 진단에 필요한 정보가 아니라 분류에 필요한 정보만 받는다. */
export interface IntakeForm {
  title: string
  body: string
  onsetDate: string
  course: SymptomCourse
  bodyAreas: BodyArea[]
  dailyImpact: DailyImpact
  triedRemedies: TriedRemedy[]
  region: string
  priorVisit: PriorVisit | null
  sameSymptoms: boolean
  visibility: PostVisibility
  selectedSymptoms: string[]
  painLevel: PainLevel
  intakeAnswers: IntakeAnswer[]
}

export interface IntakeRuleSet {
  name: string
  asOf: string
  /** 부위 선택을 진료과 분류용 키워드로 펼치는 표. */
  areaKeywords: Record<BodyArea, string[]>
}

/** 환자에게 귀속되는 비대면 사전 확인 결과. 의료기관 의존 입력은 담지 않는다. */
export interface TelemedicinePrecheck {
  completedAt: string | null
  identityVerified: boolean
  region: string
  monthlyTelemedicineCount: number
  exception: EligibilityException
  agreedToTerms: boolean
}

export interface TelemedicineGate {
  enabled: boolean
  /** enabled면 빈 문자열. 막혔으면 첫 번째 실패 체크의 detail을 그대로 쓴다. */
  reason: string
  /** 사전 확인 전에는 판정 자체를 하지 않으므로 null. */
  result: EligibilityResult | null
}

/**
 * 대면 진료 희망 시간 전달 기록. 우리가 예약을 확정하지 않는다.
 * 병원이 확인해야 성사되며 이 데모는 브라우저 메모리에만 남긴다.
 */
export interface BookingRequest {
  id: string
  doctorId: string
  clinicId: string
  date: string
  time: string
  requestedAt: string
  documentTypes: DocumentType[]
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
