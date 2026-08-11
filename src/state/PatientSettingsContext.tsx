import { createContext, useContext, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import type { PostVisibility } from '../domain/types'

export type DemoPaymentMethodId = 'none' | 'demo-hana' | 'demo-kakao'

export interface PatientSettings {
  address: {
    region: string
    detail: string
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
  const [settings, setSettings] = useState(initialPatientSettings)
  const [notice, setNotice] = useState('')

  const value = useMemo<PatientSettingsContextValue>(
    () => ({
      settings,
      notice,
      updateSettings: (patch, nextNotice) => {
        setSettings((current) => ({ ...current, ...patch }))
        setNotice(nextNotice)
      },
      resetSettings: () => {
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
