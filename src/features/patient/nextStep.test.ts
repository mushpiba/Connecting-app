import { demoAnswers, demoQuestions } from '../../data/demoQuestions'
import { resolveNextStep } from './nextStep'
import type { BookingRequest } from '../../domain/types'

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
