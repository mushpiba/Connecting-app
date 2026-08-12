import { act, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import {
  PatientSettingsProvider,
  initialPatientSettings,
  usePatientSettings,
} from './PatientSettingsContext'

function wrapper({ children }: PropsWithChildren) {
  return <PatientSettingsProvider>{children}</PatientSettingsProvider>
}

describe('PatientSettingsContext', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('주소와 결제 설정을 현재 세션에서 갱신한다', () => {
    const { result } = renderHook(() => usePatientSettings(), { wrapper })

    act(() => {
      result.current.updateSettings(
        {
          address: { region: '서울 성동구', detail: '회사', savedAt: '2026-08-09T10:00:00.000Z' },
          paymentMethodId: 'demo-hana',
        },
        '진료 준비 설정을 저장했습니다.',
      )
    })

    expect(result.current.settings.address).toEqual({
      region: '서울 성동구',
      detail: '회사',
      savedAt: '2026-08-09T10:00:00.000Z',
    })
    expect(result.current.settings.paymentMethodId).toBe('demo-hana')
    expect(result.current.notice).toBe('진료 준비 설정을 저장했습니다.')
  })

  it('새로 열어도 저장한 주소가 남는다', () => {
    const first = renderHook(() => usePatientSettings(), { wrapper })

    act(() => {
      first.result.current.updateSettings(
        {
          address: { region: '서울 성동구', detail: '', savedAt: '2026-08-09T10:00:00.000Z' },
        },
        '주소를 저장했습니다.',
      )
    })
    first.unmount()

    const reopened = renderHook(() => usePatientSettings(), { wrapper })
    expect(reopened.result.current.settings.address.savedAt).toBe('2026-08-09T10:00:00.000Z')
    expect(reopened.result.current.settings.address.region).toBe('서울 성동구')
  })

  it('저장한 설정을 기기 밖으로 내보내지 않는다', () => {
    const { result } = renderHook(() => usePatientSettings(), { wrapper })

    act(() => {
      result.current.updateSettings(
        {
          address: { region: '서울 성동구', detail: '집', savedAt: '2026-08-09T10:00:00.000Z' },
        },
        '주소를 저장했습니다.',
      )
    })

    // 남는 곳은 이 기기의 localStorage 하나뿐이다. 서버로 보내는 경로를 만들지 않는다.
    expect(Object.keys(window.localStorage)).toEqual(['medivu.patientSettings'])
  })

  it('설정만 초기값으로 되돌린다', () => {
    const { result } = renderHook(() => usePatientSettings(), { wrapper })

    act(() => {
      result.current.updateSettings(
        { notifications: { answers: false, bookings: false, service: true } },
        '알림 설정을 저장했습니다.',
      )
      result.current.resetSettings()
    })

    expect(result.current.settings).toEqual(initialPatientSettings)
    expect(result.current.notice).toBe('설정을 초기화했습니다.')
  })
})
