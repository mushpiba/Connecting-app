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
  BookingRequest,
  Clinic,
  Doctor,
  Empathy,
  Patient,
  Question,
  QuestionNote,
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
}

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

  const [questions, answers, empathies, bookings, clinics, notes, profiles] = await Promise.all([
    client.from('questions').select(QUESTION_COLUMNS).order('created_at', { ascending: false }),
    client.from('answers').select('*').order('created_at'),
    client.from('empathies').select('*'),
    client.from('bookings').select('*').order('created_at'),
    client.from('clinics').select('*'),
    client.from('question_notes').select('*').order('created_at'),
    client
      .from('profiles')
      .select('id, display_name, role, region, license_verified, clinic_id, specialty, template_id'),
  ])

  const failure = [questions, answers, empathies, bookings, clinics, notes, profiles].find(
    (result) => result.error,
  )
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
  }
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
    .subscribe()

  return () => {
    void client.removeChannel(channel)
  }
}
