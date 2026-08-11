import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { toggleEmpathy } from '../domain/board'
import type {
  Answer,
  AppRole,
  BookingRequest,
  Empathy,
  Question,
  TelemedicinePrecheck,
} from '../domain/types'
import { demoNowIso } from '../data/demoCalendar'
import {
  demoAnswers,
  demoCurrentPatientId,
  demoEmpathies,
  demoQuestions,
} from '../data/demoQuestions'
import { demoDoctors } from '../data/demoDoctors'
import { isLiveMode } from '../data/supabaseClient'
import {
  fetchSnapshot,
  insertAnswer,
  insertBooking,
  insertQuestion,
  setEmpathy,
  subscribeToChanges,
} from '../data/liveRepository'
import { hasEmpathized } from '../domain/board'
import { useSession } from './SessionContext'
import type { LiveSnapshot } from '../data/liveRepository'

export interface CommunityState {
  role: AppRole
  patientId: string
  doctorId: string
  questions: Question[]
  answers: Answer[]
  empathies: Empathy[]
  precheck: TelemedicinePrecheck
  requestedEncounterIds: string[]
  bookings: BookingRequest[]
}

export type CommunityAction =
  | { type: 'switch-role'; role: AppRole }
  | { type: 'switch-doctor'; doctorId: string }
  | { type: 'publish-question'; question: Question }
  | { type: 'publish-answer'; answer: Answer }
  | { type: 'toggle-empathy'; questionId: string }
  | { type: 'complete-precheck'; precheck: TelemedicinePrecheck }
  | { type: 'request-encounter'; questionId: string; doctorId: string }
  | { type: 'request-booking'; booking: BookingRequest }
  | { type: 'load-snapshot'; snapshot: LiveSnapshot; profileId: string; role: AppRole }
  | { type: 'reset' }

export const initialPrecheck: TelemedicinePrecheck = {
  completedAt: null,
  identityVerified: false,
  region: '인천 미추홀구',
  monthlyTelemedicineCount: 0,
  exception: 'none',
  agreedToTerms: false,
}

export const initialCommunityState: CommunityState = {
  role: 'patient',
  patientId: demoCurrentPatientId,
  doctorId: demoDoctors[0].id,
  questions: demoQuestions,
  answers: demoAnswers,
  empathies: demoEmpathies,
  precheck: initialPrecheck,
  requestedEncounterIds: [],
  bookings: [],
}

export function communityReducer(
  state: CommunityState,
  action: CommunityAction,
): CommunityState {
  switch (action.type) {
    case 'switch-role':
      return { ...state, role: action.role }
    case 'switch-doctor':
      return { ...state, doctorId: action.doctorId }
    case 'publish-question':
      return { ...state, questions: [action.question, ...state.questions] }
    case 'publish-answer':
      return { ...state, answers: [...state.answers, action.answer] }
    case 'toggle-empathy':
      return {
        ...state,
        empathies: toggleEmpathy(
          state.empathies,
          action.questionId,
          state.patientId,
          demoNowIso,
        ),
      }
    case 'complete-precheck':
      return { ...state, precheck: action.precheck }
    case 'request-encounter': {
      const id = `${action.questionId}:${action.doctorId}`
      if (state.requestedEncounterIds.includes(id)) return state
      return { ...state, requestedEncounterIds: [...state.requestedEncounterIds, id] }
    }
    case 'request-booking': {
      const kept = state.bookings.filter((item) => item.id !== action.booking.id)
      return { ...state, bookings: [...kept, action.booking] }
    }
    /** 서버에서 읽은 것으로 통째로 갈아 끼운다. 무엇이 바뀌었는지 따지지 않는다. */
    case 'load-snapshot':
      return {
        ...state,
        role: action.role,
        patientId: action.profileId,
        doctorId: action.role === 'doctor' ? action.profileId : state.doctorId,
        questions: action.snapshot.questions,
        answers: action.snapshot.answers,
        empathies: action.snapshot.empathies,
        bookings: action.snapshot.bookings,
      }
    case 'reset':
      return initialCommunityState
    default:
      return state
  }
}

interface CommunityContextValue {
  state: CommunityState
  statusNotice: string
  switchRole: (role: AppRole) => void
  switchDoctor: (doctorId: string) => void
  publishQuestion: (question: Question) => void
  publishAnswer: (answer: Answer) => void
  toggleQuestionEmpathy: (questionId: string) => void
  completePrecheck: (precheck: TelemedicinePrecheck) => void
  requestEncounter: (questionId: string, doctorId: string) => void
  requestBooking: (booking: BookingRequest) => void
  resetDemo: () => void
  /** 라이브 모드에서만 채워진다. 화면은 없으면 데모 픽스처를 쓴다. */
  live: LiveSnapshot | null
}

const CommunityContext = createContext<CommunityContextValue | null>(null)

export function CommunityProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(communityReducer, initialCommunityState)
  const [statusNotice, setStatusNotice] = useState('')
  const [live, setLive] = useState<LiveSnapshot | null>(null)
  const { status, profile } = useSession()
  const ready = isLiveMode && status === 'ready' && profile !== null

  const reload = useCallback(async () => {
    if (!profile) return
    try {
      const snapshot = await fetchSnapshot()
      setLive(snapshot)
      dispatch({
        type: 'load-snapshot',
        snapshot,
        profileId: profile.id,
        role: profile.role,
      })
    } catch (error) {
      setStatusNotice(error instanceof Error ? error.message : '불러오지 못했습니다.')
    }
  }, [profile])

  useEffect(() => {
    if (!ready) return
    void reload()
    return subscribeToChanges(() => {
      void reload()
    })
  }, [ready, reload])

  const value = useMemo<CommunityContextValue>(
    () => ({
      state,
      statusNotice,
      switchRole: (role) => {
        dispatch({ type: 'switch-role', role })
        setStatusNotice(role === 'doctor' ? '의사 화면으로 전환했습니다.' : '환자 화면으로 전환했습니다.')
      },
      switchDoctor: (doctorId) => dispatch({ type: 'switch-doctor', doctorId }),
      publishQuestion: (question) => {
        if (ready && profile) {
          void insertQuestion(question, profile.id)
            .then(reload)
            .catch((error: Error) => setStatusNotice(error.message))
          setStatusNotice('사연을 올렸습니다.')
          return
        }
        dispatch({ type: 'publish-question', question })
        setStatusNotice('질문을 등록했습니다. 브라우저 메모리에만 저장했습니다.')
      },
      publishAnswer: (answer) => {
        if (ready && profile) {
          void insertAnswer(answer.questionId, profile.id, answer.body)
            .then(reload)
            .catch((error: Error) => setStatusNotice(error.message))
          setStatusNotice('답변을 등록했습니다.')
          return
        }
        dispatch({ type: 'publish-answer', answer })
        setStatusNotice('답변을 등록했습니다. 브라우저 메모리에만 저장했습니다.')
      },
      toggleQuestionEmpathy: (questionId) => {
        if (ready && profile) {
          const on = !hasEmpathized(state.empathies, questionId, profile.id)
          void setEmpathy(questionId, profile.id, on)
            .then(reload)
            .catch((error: Error) => setStatusNotice(error.message))
          return
        }
        dispatch({ type: 'toggle-empathy', questionId })
      },
      completePrecheck: (precheck) => {
        dispatch({ type: 'complete-precheck', precheck })
        setStatusNotice('비대면 사전 확인을 마쳤습니다.')
      },
      requestEncounter: (questionId, doctorId) => {
        dispatch({ type: 'request-encounter', questionId, doctorId })
        setStatusNotice('진료 신청 의사를 전달했습니다. 실제 예약은 이루어지지 않습니다.')
      },
      requestBooking: (booking) => {
        if (ready && profile) {
          void insertBooking(booking, profile.id)
            .then(reload)
            .catch((error: Error) => setStatusNotice(error.message))
          setStatusNotice('희망 시간을 전달했습니다. 실제 예약은 병원이 확인해야 확정됩니다.')
          return
        }
        dispatch({ type: 'request-booking', booking })
        setStatusNotice('희망 시간을 전달했습니다. 실제 예약은 병원이 확인해야 확정됩니다.')
      },
      resetDemo: () => {
        dispatch({ type: 'reset' })
        setStatusNotice('데모가 초기 상태로 복원됐습니다.')
      },
      live,
    }),
    [state, statusNotice, live, ready, profile, reload],
  )

  return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>
}

export function useCommunity() {
  const context = useContext(CommunityContext)
  if (!context) throw new Error('useCommunity must be used within CommunityProvider')
  return context
}
