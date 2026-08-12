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
    expect(window.localStorage).toHaveLength(0)
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
