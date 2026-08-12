import { createContext, useContext, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import type { PostVisibility } from '../domain/types'
import { clearLocal, readLocal, writeLocal } from './localStore'

/**
 * 주소와 알림 설정은 새로고침을 넘겨야 한다. 저장해 놓고 화면을 한 번 새로
 * 고쳤다고 "주소 설정"이 다시 미완료로 돌아가면 비대면 준비가 영영 안 끝난다.
 */
const SETTINGS_KEY = 'medivu.patientSettings'

export type DemoPaymentMethodId = 'none' | 'demo-hana' | 'demo-kakao'

export interface PatientSettings {
  address: {
    region: string
    detail: string
    /**
     * 사용자가 확인해서 저장한 시각. 별칭은 비워 둘 수 있어 완료 여부를 가릴 수
     * 없다. 지역에는 기본값이 있어 값만 보고는 확인했는지 알 수 없다.
     */
    savedAt: string | null
  }
  paymentMethodId: DemoPaymentMethodId
  notifications: {
    answers: boolean
    bookings: boolean
    service: boolean
  }
  defaultVisibility: PostVisibility
  showProfile: boolean
}

interface PatientSettingsContextValue {
  settings: PatientSettings
  notice: string
  updateSettings: (patch: Partial<PatientSettings>, notice: string) => void
  resetSettings: () => void
}

export const initialPatientSettings: PatientSettings = {
  address: {
    region: '인천 미추홀구',
    detail: '',
    savedAt: null,
  },
  paymentMethodId: 'none',
  notifications: {
    answers: true,
    bookings: true,
    service: false,
  },
  defaultVisibility: 'public',
  showProfile: true,
}

const PatientSettingsContext = createContext<PatientSettingsContextValue | null>(null)

export function PatientSettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState(() =>
    readLocal(SETTINGS_KEY, initialPatientSettings),
  )
  const [notice, setNotice] = useState('')

  const value = useMemo<PatientSettingsContextValue>(
    () => ({
      settings,
      notice,
      updateSettings: (patch, nextNotice) => {
        setSettings((current) => {
          const next = { ...current, ...patch }
          writeLocal(SETTINGS_KEY, next)
          return next
        })
        setNotice(nextNotice)
      },
      resetSettings: () => {
        clearLocal(SETTINGS_KEY)
        setSettings(initialPatientSettings)
        setNotice('설정을 초기화했습니다.')
      },
    }),
    [notice, settings],
  )

  return <PatientSettingsContext.Provider value={value}>{children}</PatientSettingsContext.Provider>
}

export function usePatientSettings() {
  const context = useContext(PatientSettingsContext)
  if (!context) {
    throw new Error('usePatientSettings must be used inside PatientSettingsProvider')
  }
  return context
}
