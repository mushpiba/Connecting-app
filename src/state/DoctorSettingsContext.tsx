import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { demoDoctorSettings, settingsFor } from '../data/demoDoctorSettings'
import type { ReviewState } from '../domain/doctorFeed'
import type { DoctorSettings } from '../domain/types'

interface DoctorSettingsContextValue {
  /**
   * 계정 설정. 라이브에서는 계정 id가 uuid라 준비된 프로필 id로 한 번 더 찾는다.
   * 그러지 않으면 골라 들어온 의사가 빈 설정으로 시작한다.
   */
  settingsOf: (doctorId: string, templateId?: string) => DoctorSettings
  update: (doctorId: string, patch: Partial<DoctorSettings>, notice: string) => void
  notice: string
  /** 사연을 읽었는지 미뤘는지. 지운 것이 아니라 나중에 볼 것으로 표시한다. */
  reviewOf: (doctorId: string, questionId: string) => ReviewState
  setReview: (doctorId: string, questionId: string, state: ReviewState) => void
  reset: () => void
}

const DoctorSettingsContext = createContext<DoctorSettingsContextValue | null>(null)

/**
 * 의사가 정하는 값들. 브라우저 메모리에만 둔다.
 *
 * 서버에 올리려면 프로필 표에 열을 더 만들어야 하는데, 지금은 어떤 값이
 * 필요한지 화면으로 먼저 확인하는 단계다. 무엇을 저장할지 정해진 뒤에 옮긴다.
 */
export function DoctorSettingsProvider({ children }: PropsWithChildren) {
  const [overrides, setOverrides] = useState<DoctorSettings[]>(demoDoctorSettings)
  const [notice, setNotice] = useState('')
  const [reviews, setReviews] = useState<Record<string, ReviewState>>({})

  const settingsOf = useCallback(
    (doctorId: string, templateId?: string) =>
      overrides.find((item) => item.doctorId === doctorId) ??
      (templateId ? overrides.find((item) => item.doctorId === templateId) : undefined) ??
      settingsFor(templateId ?? doctorId),
    [overrides],
  )

  const update = useCallback(
    (doctorId: string, patch: Partial<DoctorSettings>, message: string) => {
      setOverrides((prev) => {
        const current = prev.find((item) => item.doctorId === doctorId) ?? settingsFor(doctorId)
        const next = { ...current, ...patch }
        return [...prev.filter((item) => item.doctorId !== doctorId), next]
      })
      setNotice(message)
    },
    [],
  )

  const reviewOf = useCallback(
    (doctorId: string, questionId: string): ReviewState => reviews[`${doctorId}:${questionId}`] ?? 'new',
    [reviews],
  )

  const setReview = useCallback(
    (doctorId: string, questionId: string, state: ReviewState) => {
      setReviews((prev) => ({ ...prev, [`${doctorId}:${questionId}`]: state }))
      setNotice(state === 'held' ? '나중에 볼 것으로 표시했습니다.' : '읽음으로 표시했습니다.')
    },
    [],
  )

  const reset = useCallback(() => {
    setReviews({})
    setOverrides(demoDoctorSettings)
    setNotice('의사 설정을 처음 상태로 되돌렸습니다.')
  }, [])

  const value = useMemo<DoctorSettingsContextValue>(
    () => ({ settingsOf, update, notice, reviewOf, setReview, reset }),
    [settingsOf, update, notice, reviewOf, setReview, reset],
  )

  return <DoctorSettingsContext.Provider value={value}>{children}</DoctorSettingsContext.Provider>
}

export function useDoctorSettings() {
  const context = useContext(DoctorSettingsContext)
  if (!context) throw new Error('useDoctorSettings must be used inside DoctorSettingsProvider')
  return context
}
