import { activeEncounter, doctorActions, encounterTrack } from './encounterTrack'
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

  it('의사가 확인하면 2단계가 채워지고 진료방은 아직 닫혀 있다', () => {
    const track = encounterTrack(request({ status: 'accepted' }), '가상 김이비')

    expect(track.roomOpen).toBe(false)
    expect(track.headline).toBe('의사가 신청을 확인했습니다')
    expect(track.steps.filter((step) => step.done)).toHaveLength(2)
  })

  it('진료를 마치면 네 단계가 전부 채워진다', () => {
    const track = encounterTrack(request({ status: 'completed' }), '가상 김이비')

    expect(track.roomOpen).toBe(false)
    expect(track.steps.filter((step) => step.done)).toHaveLength(4)
    expect(track.headline).toBe('진료가 끝났습니다')
  })

  it('거절되면 다음에 할 수 있는 것을 알려준다', () => {
    const track = encounterTrack(request({ status: 'declined' }), '가상 김이비')

    expect(track.roomOpen).toBe(false)
    expect(track.detail).toContain('대면 진료를 예약')
  })
})

describe('doctorActions', () => {
  it('신청이 도착하면 확인·열기·거절 셋이다', () => {
    expect(doctorActions(request()).map((action) => action.to)).toEqual([
      'accepted',
      'in-progress',
      'declined',
    ])
  })

  it('확인한 뒤에는 다시 확인할 수 없다', () => {
    expect(doctorActions(request({ status: 'accepted' })).map((action) => action.to)).toEqual([
      'in-progress',
      'declined',
    ])
  })

  it('진료방이 열린 뒤에는 마치는 것 하나뿐이다', () => {
    const actions = doctorActions(request({ status: 'in-progress' }))

    expect(actions).toHaveLength(1)
    expect(actions[0].to).toBe('completed')
  })

  it('거절은 되돌릴 수 없다고 표시한다', () => {
    const decline = doctorActions(request()).find((action) => action.to === 'declined')

    expect(decline?.irreversible).toBe(true)
  })

  it('끝난 신청에는 남은 동작이 없다', () => {
    expect(doctorActions(request({ status: 'completed' }))).toEqual([])
    expect(doctorActions(request({ status: 'declined' }))).toEqual([])
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

  it('거절된 신청은 세우지 않는다', () => {
    expect(activeEncounter([request({ status: 'declined' })], 'p-1')).toBeNull()
  })
})
