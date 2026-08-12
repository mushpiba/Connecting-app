import { activeEncounter, encounterTrack } from './encounterTrack'
import type { EncounterRequest } from './types'

function request(overrides: Partial<EncounterRequest> = {}): EncounterRequest {
  return {
    id: 'e-1',
    questionId: 'q-1',
    patientId: 'p-1',
    doctorId: 'd-1',
    clinicId: 'c-1',
    status: 'requested',
    createdAt: '2026-08-12T01:00:00.000Z',
    ...overrides,
  }
}

describe('encounterTrack', () => {
  it('신청 직후에는 진료방을 열지 않는다', () => {
    const track = encounterTrack(request(), '가상 김이비')

    expect(track.roomOpen).toBe(false)
    expect(track.headline).toBe('진료 신청을 보냈습니다')
  })

  it('의사가 열면 들어갈 수 있다', () => {
    const track = encounterTrack(request({ status: 'in-progress' }), '가상 김이비')

    expect(track.roomOpen).toBe(true)
    expect(track.steps.filter((step) => step.done)).toHaveLength(3)
  })

  it('거절되면 다음에 할 수 있는 것을 알려준다', () => {
    const track = encounterTrack(request({ status: 'declined' }), '가상 김이비')

    expect(track.roomOpen).toBe(false)
    expect(track.detail).toContain('대면 진료를 예약')
  })
})

describe('activeEncounter', () => {
  it('끝난 신청은 세우지 않는다', () => {
    expect(activeEncounter([request({ status: 'completed' })], 'p-1')).toBeNull()
  })

  it('남의 신청은 세우지 않는다', () => {
    expect(activeEncounter([request({ patientId: 'p-2' })], 'p-1')).toBeNull()
  })

  it('진료방이 열린 것을 먼저 세운다', () => {
    const list = [request({ id: 'e-1' }), request({ id: 'e-2', status: 'in-progress' })]

    expect(activeEncounter(list, 'p-1')?.id).toBe('e-2')
  })
})
