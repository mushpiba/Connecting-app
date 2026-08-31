import { demoAnswers, demoQuestions } from '../../data/demoQuestions'
import { encounterTrack } from '../../domain/encounterTrack'
import { progressStrip, resolveNextStep } from './nextStep'
import type { BookingRequest, EncounterRequest } from '../../domain/types'

const today = '2026-08-09'

const booking: BookingRequest = {
  id: 'doc-han-ent:2026-08-11:10:30',
  doctorId: 'doc-han-ent',
  clinicId: 'clinic-han',
  date: '2026-08-11',
  time: '10:30',
  requestedAt: '2026-08-09T10:00:00.000Z',
  documentTypes: [],
}

describe('resolveNextStep', () => {
  it('사연이 없으면 증상 적기를 띄운다', () => {
    const step = resolveNextStep(demoQuestions, demoAnswers, [], 'pat-none', today)

    expect(step.kind).toBe('first-visit')
    expect(step.actionPath).toBe('/ask')
  })

  it('답변이 오면 답변을 최우선으로 올린다', () => {
    const step = resolveNextStep(demoQuestions, demoAnswers, [], 'pat-min', today)

    expect(step.kind).toBe('answered')
    expect(step.answerCount).toBeGreaterThan(0)
    expect(step.actionPath).toContain('/questions/')
  })

  it('답변이 없으면 기다리는 중으로 둔다', () => {
    const step = resolveNextStep(demoQuestions, [], [], 'pat-min', today)

    expect(step.kind).toBe('waiting')
    expect(step.detail).toContain('증상')
  })

  it('예약을 전달했으면 그것이 가장 급한 정보다', () => {
    const step = resolveNextStep(demoQuestions, demoAnswers, [booking], 'pat-min', today)

    expect(step.kind).toBe('booked')
    expect(step.detail).toContain('2026-08-11 10:30')
  })

  it('기준일을 인자로 받아 같은 입력에 같은 결과를 준다', () => {
    expect(resolveNextStep(demoQuestions, demoAnswers, [], 'pat-min', today)).toEqual(
      resolveNextStep(demoQuestions, demoAnswers, [], 'pat-min', today),
    )
  })
})

const encounter: EncounterRequest = {
  id: 'enc-1',
  questionId: 'q-1',
  patientId: 'pat-min',
  doctorId: 'doc-han-ent',
  clinicId: 'clinic-han',
  status: 'in-progress',
  createdAt: '2026-08-09T09:00:00.000Z',
}

describe('progressStrip', () => {
  it('진행 중인 건이 없으면 자리도 만들지 않는다', () => {
    const step = resolveNextStep(demoQuestions, demoAnswers, [], 'pat-none', today)

    expect(progressStrip(step, null, today)).toBeNull()
  })

  it('진료방이 열리면 예약보다 위다', () => {
    const step = resolveNextStep(demoQuestions, demoAnswers, [booking], 'pat-min', today)
    const track = encounterTrack(encounter, '가상 김이비')

    expect(progressStrip(step, track, today)).toEqual({
      kind: 'room-open',
      label: '진료방이 열렸습니다 · 지금 들어가세요',
      path: '/visit/enc-1',
    })
  })

  it('아직 열리지 않은 신청은 스트립을 가로채지 않는다', () => {
    const step = resolveNextStep(demoQuestions, demoAnswers, [booking], 'pat-min', today)
    const track = encounterTrack({ ...encounter, status: 'requested' }, '가상 김이비')

    expect(progressStrip(step, track, today)?.kind).toBe('booked')
  })

  it('예약은 날짜와 시간을 그대로 싣고 진료 탭으로 보낸다', () => {
    const step = resolveNextStep(demoQuestions, demoAnswers, [booking], 'pat-min', today)

    expect(progressStrip(step, null, today)).toEqual({
      kind: 'booked',
      label: '예약 희망 시간을 전달했어요 · 2026-08-11 10:30',
      path: '/care',
    })
  })

  it('답변이 오면 그 사연으로 보낸다', () => {
    const step = resolveNextStep(demoQuestions, demoAnswers, [], 'pat-min', today)
    const strip = progressStrip(step, null, today)

    expect(strip?.kind).toBe('answered')
    expect(strip?.label).toMatch(/^의사 \d+명이 답변했어요$/)
    expect(strip?.path).toContain('/questions/')
  })

  it('기다리는 중이면 며칠째인지 적는다', () => {
    const step = resolveNextStep(demoQuestions, [], [], 'pat-min', today)
    const strip = progressStrip(step, null, today)

    expect(strip?.kind).toBe('waiting')
    expect(strip?.label).toContain('증상')
    expect(strip?.label).toContain('일째')
  })
})
