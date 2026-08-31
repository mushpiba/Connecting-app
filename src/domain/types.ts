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
  /** 면허 종류. 제57조3항 심의 예외 항목이라 프로필에 실을 수 있다. */
  licenseType: LicenseType
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

/** 진료 신청 한 건의 상태. 서버 enum과 같은 값을 쓴다. */
export type EncounterRequestStatus =
  | 'requested'
  | 'accepted'
  | 'in-progress'
  | 'completed'
  | 'declined'

/**
 * 환자가 낸 비대면 진료 신청.
 *
 * Encounter 는 진료가 끝난 뒤 EMR로 넘길 내용까지 담는다. 신청은 그 앞 단계라
 * 훨씬 가볍고, 무엇보다 서버에 남아야 한다. 신청이 화면 메모리에만 있으면
 * 의사 쪽에는 아무 일도 일어나지 않는다.
 *
 * id 가 그대로 진료방 주소가 된다. 방 이름을 따로 만들면 두 사람이 서로 다른
 * 방에 들어가는 길이 생긴다.
 */
export interface EncounterRequest {
  id: string
  questionId: string | null
  patientId: string
  doctorId: string
  clinicId: string
  status: EncounterRequestStatus
  createdAt: string
}

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

/**
 * 환자가 손으로 적은 의료기관.
 *
 * 앱 내 이력(`bookings` · `encounters`)과 **섞지 않는다.** 검증되지 않은 것이
 * 검증된 것처럼 보이면 화면이 환자의 말을 대신 만들어 낸 것이 된다.
 *
 * 이 기록으로는 비대면 재진 자격이 열리지 않는다 — `eligibility` 판정의 입력에
 * 넣지 않는다. 다시 찾아가기 위한 메모이지 자격 근거가 아니다.
 */
export interface SelfReportedClinic {
  id: string
  patientId: string
  /** 환자가 적은 이름 그대로. 우리가 고치지 않는다. */
  name: string
  lastVisitedOn: string
  trust: 'self-reported'
  createdAt: string
}

/**
 * 면허 종류. 의료법 제57조3항의 심의 예외 항목이다.
 *
 * 자유 문자열이 아니라 유니온으로 둔다. 프로필에서 자유 서술을 걷어낸 이유가
 * 홍보 문구였는데, 여기를 `string`으로 열어 두면 그 문구가 이 칸으로 옮겨 온다.
 * 「전문의 여부」를 적고 싶으면 진료과목(`specialty`)이 이미 그 자리다 (C-3).
 */
export type LicenseType = '의사' | '치과의사' | '한의사'

/**
 * 의사 하루 공개 답변 상한. D-8은 5회/일이고 초기화는 매일 자정(KST)이다.
 *
 * 값이 유권해석과 실측(H-3)으로 움직이므로 판정 코드에 박지 않는다 (원칙 7).
 * 이 파일만 고치면 화면과 판정이 같이 따라온다.
 */
export interface AnswerLimitRuleSet {
  name: string
  asOf: string
  /** 하루에 쓸 수 있는 공개 답변 수. 비공개 덧붙임 회신은 세지 않는다. */
  dailyLimit: number
  /** 다시 채워지는 시각(KST, 0~23). 0이면 자정이다. */
  resetHourKst: number
}

/**
 * 비공개 덧붙임 · 대화 하나. D-6이 정한 1:1 후속이다.
 *
 * 답변 카드 하나에 대화 하나다. `answerId`가 널을 허용하는 것은 표 쪽이고,
 * 화면이 여는 대화에는 늘 답변이 있다 — 경계는 컬럼이 아니라 정책에 있다.
 */
export interface PrivateThread {
  id: string
  questionId: string
  answerId: string
  patientId: string
  doctorId: string
  createdAt: string
}

/** 대화 안의 말풍선 하나. 보낸 뒤에는 고치거나 지울 수 없다. */
export interface PrivateMessage {
  id: string
  threadId: string
  senderId: string
  /** 말풍선 좌우와 고정 고지가 이 값으로 갈린다. */
  senderRole: AppRole
  body: string
  createdAt: string
}

/** 표현 필터가 어디에서 걸렸나. 공개 답변과 비공개 회신 둘 다 있다 (C-3). */
export type FilterSurface = 'public-answer' | 'private-message'

/**
 * 표현 필터에 걸려 **전송이 막힌 사실**. 양벌규정(제91조) 방어 자료다.
 *
 * **본문을 담지 않는다.** 필요한 것은 우리가 걸렀다는 사실이지 환자의 증상
 * 원문이 아니다. 막으려고 만든 장치가 새 민감정보 보관소가 되면 안 된다.
 * 그래서 남는 것은 규칙 ID · 규칙셋 기준일 · 걸린 조각 20자까지다.
 */
export interface ExpressionFilterHit {
  id: string
  authorId: string
  surface: FilterSurface
  /** 공개 답변이면 어느 사연에서. 비공개 회신이면 널이다. */
  questionId: string | null
  /** 비공개 회신이면 어느 대화에서. 공개 답변이면 널이다. */
  threadId: string | null
  ruleId: string
  /**
   * 그때 무슨 규칙셋이 판단했나.
   *
   * **규칙 파라미터가 아니라 지나간 사실이다.** 규칙 파일이 바뀌어도 이 값은
   * 바뀌면 안 된다 — 방향이 반대다.
   */
  ruleSetAsOf: string
  /** 걸린 조각. 20자를 넘기지 않는다. */
  matchedSpan: string
  createdAt: string
}

/**
 * 표현 필터 규칙 하나. PT-1 ~ PT-5.
 *
 * **진단명 사전이 아니다.** 병명은 끝이 없어서 사전은 반드시 샌다. 대신 단정
 * 어미와 지시 어미를 잡는다. 진단명을 말했는지가 아니라 **단정했는지**가
 * 경계다 — 막는 것은 지시이지 지식이 아니다.
 */
export interface PrivateThreadRule {
  /** `PT-1` ~ `PT-5`. 걸린 기록에 이 값이 남는다. */
  id: string
  /** 무엇을 잡나. 로그를 사람이 읽을 때 쓴다. */
  label: string
  /** 정규식 원문. 판정은 `i` 플래그로 한다. */
  source: string
  /**
   * 걸렸을 때 화면에 나가는 글. `{}` 자리에 걸린 조각이 들어간다.
   *
   * 「부적절한 표현입니다」처럼 뭉뚱그리지 않는다 — 무엇을 고쳐야 하는지 알 수
   * 없으면 고칠 수 없다.
   */
  message: string
}

/**
 * 비공개 덧붙임의 경계값. D-6이 비워 둔 항목 3·5의 수치를 §Q-5가 채운 것이다.
 *
 * **경계의 위치 자체가 유권해석 대상이라 움직인다**(D-6 §남은 확인). 국민신문고
 * 회신이 오면 이 규칙셋만 고친다 — 판정 코드와 스키마는 그대로다 (원칙 7).
 */
export interface PrivateThreadRuleSet {
  name: string
  source: string
  asOf: string
  limits: {
    /** 한 왕복 = 환자 1 + 의사 1. 3이면 말풍선 최대 6개다. */
    maxRounds: number
    patientMaxChars: number
    /**
     * 의사 쪽이 짧은 것은 **의도한 비대칭**이다. 위법의 주체는 환자가 아니라
     * 의료인이고 양벌규정이 향하는 곳도 우리다. 고정 고지는 여기 포함하지
     * 않는다 — 지울 수 없는 글이 글자 수를 먹으면 고지가 벌칙이 된다.
     */
    doctorMaxChars: number
  }
  /** 적용 대상은 의사 쪽 글뿐이다. 환자 발화는 걸지 않는다. */
  bannedPatterns: PrivateThreadRule[]
}
