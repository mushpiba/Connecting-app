import { demoDoctors } from './demoDoctors'
import { requireSupabase } from './supabaseClient'
import {
  toAnswer,
  toBooking,
  toClinic,
  toDoctor,
  toEmpathy,
  toPatient,
  toQuestion,
  toQuestionInsert,
} from './liveMappers'
import type { ProfileRow } from './liveMappers'
import type {
  Answer,
  AppRole,
  BookingRequest,
  Clinic,
  Doctor,
  Empathy,
  EncounterRequest,
  EncounterRequestStatus,
  ExpressionFilterHit,
  Patient,
  PrivateMessage,
  PrivateThread,
  Question,
  QuestionNote,
  SelfReportedClinic,
} from '../domain/types'

export interface LiveSnapshot {
  questions: Question[]
  notes: QuestionNote[]
  answers: Answer[]
  empathies: Empathy[]
  bookings: BookingRequest[]
  clinics: Clinic[]
  doctors: Doctor[]
  patients: Patient[]
  encounters: EncounterRequest[]
  selfReportedClinics: SelfReportedClinic[]
  /** 당사자 둘에게만 온다. RLS가 이미 걸러서 남의 대화는 여기 없다. */
  privateThreads: PrivateThread[]
  privateMessages: PrivateMessage[]
}

const PRIVATE_THREAD_COLUMNS = 'id, question_id, answer_id, patient_id, doctor_id, created_at'

const QUESTION_COLUMNS =
  'id, author_id, title, body, visibility, onset_date, course, daily_impact, tried_remedies, body_areas, selected_symptoms, pain_level, intake_answers, triage, prior_clinic_id, prior_visited_on, same_symptoms, created_at'

/**
 * 한 번에 전부 읽는다. 테스트 규모에서는 페이지를 나눌 이유가 없고, 나누면
 * 공개 범위가 걸린 목록에서 빈 페이지가 생겨 오히려 헷갈린다.
 *
 * 안 보이는 글은 RLS가 걸러서 애초에 오지 않는다. 화면은 온 것만 그린다.
 */
export async function fetchSnapshot(): Promise<LiveSnapshot> {
  const client = requireSupabase()

  const [
    questions,
    answers,
    empathies,
    bookings,
    clinics,
    notes,
    profiles,
    encounters,
    selfReported,
    privateThreads,
    privateMessages,
  ] = await Promise.all([
    client.from('questions').select(QUESTION_COLUMNS).order('created_at', { ascending: false }),
    client.from('answers').select('*').order('created_at'),
    client.from('empathies').select('*'),
    client.from('bookings').select('*').order('created_at'),
    client.from('clinics').select('*'),
    client.from('question_notes').select('*').order('created_at'),
    client
      .from('profiles')
      .select('id, display_name, role, region, license_verified, clinic_id, specialty, template_id'),
    client
      .from('encounters')
      .select('id, question_id, patient_id, doctor_id, clinic_id, status, created_at')
      .order('created_at', { ascending: false }),
    client
      .from('self_reported_clinics')
      .select('id, patient_id, name, last_visited_on, trust, created_at')
      .order('last_visited_on', { ascending: false }),
    client.from('private_threads').select(PRIVATE_THREAD_COLUMNS).order('created_at'),
    client
      .from('private_messages')
      .select('id, thread_id, sender_id, sender_role, body, created_at')
      .order('created_at'),
  ])

  const failure = [
    questions,
    answers,
    empathies,
    bookings,
    clinics,
    notes,
    profiles,
    encounters,
    selfReported,
    privateThreads,
    privateMessages,
  ].find((result) => result.error)
  if (failure?.error) throw new Error(failure.error.message)

  const profileRows = (profiles.data ?? []) as ProfileRow[]

  return {
    questions: (questions.data ?? []).map(toQuestion),
    answers: (answers.data ?? []).map(toAnswer),
    empathies: (empathies.data ?? []).map(toEmpathy),
    bookings: (bookings.data ?? []).map(toBooking),
    clinics: (clinics.data ?? []).map(toClinic),
    notes: (notes.data ?? []).map((row) => ({
      id: row.id,
      questionId: row.question_id,
      authorId: row.author_id,
      body: row.body,
      createdAt: row.created_at,
    })),
    doctors: profileRows
      .filter((row) => row.role === 'doctor')
      .map((row) =>
        toDoctor(
          row,
          demoDoctors.find((template) => template.id === row.template_id),
        ),
      ),
    patients: profileRows.map(toPatient),
    encounters: (encounters.data ?? []).map((row) => ({
      id: row.id,
      questionId: row.question_id,
      patientId: row.patient_id,
      doctorId: row.doctor_id,
      clinicId: row.clinic_id,
      status: row.status as EncounterRequestStatus,
      createdAt: row.created_at,
    })),
    selfReportedClinics: (selfReported.data ?? []).map(toSelfReportedClinic),
    privateThreads: (privateThreads.data ?? []).map(toPrivateThread),
    privateMessages: (privateMessages.data ?? []).map((row) => ({
      id: row.id,
      threadId: row.thread_id,
      senderId: row.sender_id,
      senderRole: row.sender_role as AppRole,
      body: row.body,
      createdAt: row.created_at,
    })),
  }
}

function toPrivateThread(row: {
  id: string
  question_id: string
  answer_id: string
  patient_id: string
  doctor_id: string
  created_at: string
}): PrivateThread {
  return {
    id: row.id,
    questionId: row.question_id,
    answerId: row.answer_id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    createdAt: row.created_at,
  }
}

function toSelfReportedClinic(row: {
  id: string
  patient_id: string
  name: string
  last_visited_on: string
  trust: string
  created_at: string
}): SelfReportedClinic {
  return {
    id: row.id,
    patientId: row.patient_id,
    name: row.name,
    lastVisitedOn: row.last_visited_on,
    // 표의 check 제약이 값을 하나로 묶고 있다. 등급은 행에 실려 와야 화면이 두
    // 출처를 구분할 수 있다.
    trust: 'self-reported',
    createdAt: row.created_at,
  }
}

/** 환자가 적은 이름 그대로 넣는다. 지역·전화번호를 받지 않는다. */
export async function insertSelfReportedClinic(
  patientId: string,
  name: string,
  lastVisitedOn: string,
): Promise<SelfReportedClinic> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('self_reported_clinics')
    .insert({ patient_id: patientId, name, last_visited_on: lastVisitedOn })
    .select('id, patient_id, name, last_visited_on, trust, created_at')
    .single()

  if (error) throw new Error(error.message)
  return toSelfReportedClinic(data)
}

export async function deleteSelfReportedClinic(id: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.from('self_reported_clinics').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/**
 * 진료 신청을 남긴다.
 *
 * 돌려받은 행을 그대로 쓴다. id 를 서버가 만들고 그 id 가 진료방 주소가 되므로,
 * 화면이 임시 id 로 방을 열면 의사와 다른 방에 들어간다.
 */
export async function insertEncounter(
  questionId: string | null,
  patientId: string,
  doctorId: string,
  clinicId: string,
): Promise<EncounterRequest> {
  const client = requireSupabase()

  const { data, error } = await client
    .from('encounters')
    .insert({
      question_id: questionId,
      patient_id: patientId,
      doctor_id: doctorId,
      clinic_id: clinicId,
      status: 'requested',
    })
    .select('id, question_id, patient_id, doctor_id, clinic_id, status, created_at')
    .single()

  if (error) throw new Error(error.message)

  return {
    id: data.id,
    questionId: data.question_id,
    patientId: data.patient_id,
    doctorId: data.doctor_id,
    clinicId: data.clinic_id,
    status: data.status as EncounterRequestStatus,
    createdAt: data.created_at,
  }
}

export async function updateEncounterStatus(
  encounterId: string,
  status: EncounterRequestStatus,
): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.from('encounters').update({ status }).eq('id', encounterId)
  if (error) throw new Error(error.message)
}

export async function insertQuestion(question: Question, authorId: string): Promise<Question> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('questions')
    .insert(toQuestionInsert(question, authorId))
    .select(QUESTION_COLUMNS)
    .single()

  if (error) throw new Error(error.message)
  return toQuestion(data)
}

export async function insertAnswer(
  questionId: string,
  doctorId: string,
  body: string,
): Promise<Answer> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('answers')
    .insert({ question_id: questionId, doctor_id: doctorId, body })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return toAnswer(data)
}

/** 켜고 끄는 동작이라 넣기와 지우기를 한 자리에서 다룬다. */
export async function setEmpathy(
  questionId: string,
  patientId: string,
  on: boolean,
): Promise<void> {
  const client = requireSupabase()

  const { error } = on
    ? await client.from('empathies').insert({ question_id: questionId, patient_id: patientId })
    : await client
        .from('empathies')
        .delete()
        .eq('question_id', questionId)
        .eq('patient_id', patientId)

  if (error) throw new Error(error.message)
}

export async function insertBooking(
  booking: Omit<BookingRequest, 'id' | 'requestedAt'>,
  patientId: string,
): Promise<BookingRequest> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('bookings')
    .upsert(
      {
        patient_id: patientId,
        doctor_id: booking.doctorId,
        clinic_id: booking.clinicId,
        visit_date: booking.date,
        visit_time: booking.time,
        document_types: booking.documentTypes,
      },
      { onConflict: 'patient_id,doctor_id,visit_date,visit_time' },
    )
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return toBooking(data)
}

export async function deleteQuestion(questionId: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.from('questions').delete().eq('id', questionId)
  if (error) throw new Error(error.message)
}

/** 사연은 고칠 수 없다. 대신 덧붙인다. */
export async function insertNote(
  questionId: string,
  authorId: string,
  body: string,
): Promise<void> {
  const client = requireSupabase()
  const { error } = await client
    .from('question_notes')
    .insert({ question_id: questionId, author_id: authorId, body })
  if (error) throw new Error(error.message)
}

/**
 * 비공개 덧붙임을 연다. **환자만 부른다.**
 *
 * 의사에게는 INSERT 정책이 아예 없으므로 의사 계정이 이 함수를 불러도 서버가
 * 거부한다 — D-6 항목 1은 화면이 아니라 거기서 막힌다. 답변하지 않은 의사를
 * 적어도 `answers`를 보는 정책이 거짓이 된다(항목 2).
 */
export async function insertPrivateThread(
  questionId: string,
  answerId: string,
  patientId: string,
  doctorId: string,
): Promise<PrivateThread> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('private_threads')
    .insert({
      question_id: questionId,
      answer_id: answerId,
      patient_id: patientId,
      doctor_id: doctorId,
    })
    .select(PRIVATE_THREAD_COLUMNS)
    .single()

  if (error) throw new Error(error.message)
  return toPrivateThread(data)
}

/**
 * 말풍선 하나를 남긴다. 보낸 뒤에는 고치거나 지울 수 없다 — 표에 UPDATE·DELETE
 * 정책이 없는 것과 화면의 계약이 같다.
 *
 * **횟수·길이·표현은 여기서 확인하지 않는다.** 브라우저가 이미 판정했고, 서버가
 * 강제하는 것은 순서와 방향뿐이다(R-6 · M3).
 */
export async function insertPrivateMessage(
  threadId: string,
  senderId: string,
  senderRole: AppRole,
  body: string,
): Promise<void> {
  const client = requireSupabase()
  const { error } = await client
    .from('private_messages')
    .insert({ thread_id: threadId, sender_id: senderId, sender_role: senderRole, body })
  if (error) throw new Error(error.message)
}

/**
 * 걸린 사실을 남긴다. **읽는 함수를 만들지 않는다** — 표에 SELECT 정책이 없고,
 * 화면이 읽지 않는 것이 요건이다. 뽑는 것은 운영자가 `service_role`로 한다.
 */
export async function insertExpressionFilterHits(
  records: Omit<ExpressionFilterHit, 'id'>[],
): Promise<void> {
  if (records.length === 0) return

  const client = requireSupabase()
  const { error } = await client.from('expression_filter_hits').insert(
    records.map((record) => ({
      author_id: record.authorId,
      surface: record.surface,
      question_id: record.questionId,
      thread_id: record.threadId,
      rule_id: record.ruleId,
      rule_set_as_of: record.ruleSetAsOf,
      matched_span: record.matchedSpan,
    })),
  )
  if (error) throw new Error(error.message)
}

/**
 * 답변이 달리면 환자 화면이 바로 바뀌어야 한다. 무엇이 바뀌었는지까지
 * 따지지 않고 전체를 다시 읽는다. 이 규모에서는 그게 더 단순하고 안전하다.
 */
export function subscribeToChanges(onChange: () => void): () => void {
  const client = requireSupabase()

  const channel = client
    .channel('medivu-community')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'answers' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'empathies' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'question_notes' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'encounters' }, onChange)
    // private_threads·private_messages 는 여기 없다. 발행하지 않기로 했고, 발행
    // 설정과 RLS 가 어긋났을 때 새는 방향이 최악이다. 비공개 회신이 도착한 것은
    // 화면을 다시 열 때 알고, 알리는 자리는 /news 다(Q-7).
    .subscribe()

  return () => {
    void client.removeChannel(channel)
  }
}
