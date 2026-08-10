import { createContext, useContext, useMemo, useReducer, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { toggleEmpathy } from '../domain/board'
import type {
  Answer,
  AppRole,
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

export interface CommunityState {
  role: AppRole
  patientId: string
  doctorId: string
  questions: Question[]
  answers: Answer[]
  empathies: Empathy[]
  precheck: TelemedicinePrecheck
  requestedEncounterIds: string[]
}

export type CommunityAction =
  | { type: 'switch-role'; role: AppRole }
  | { type: 'switch-doctor'; doctorId: string }
  | { type: 'publish-question'; question: Question }
  | { type: 'publish-answer'; answer: Answer }
  | { type: 'toggle-empathy'; questionId: string }
  | { type: 'complete-precheck'; precheck: TelemedicinePrecheck }
  | { type: 'request-encounter'; questionId: string; doctorId: string }
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
  resetDemo: () => void
}

const CommunityContext = createContext<CommunityContextValue | null>(null)

export function CommunityProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(communityReducer, initialCommunityState)
  const [statusNotice, setStatusNotice] = useState('')

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
        dispatch({ type: 'publish-question', question })
        setStatusNotice('질문을 등록했습니다. 브라우저 메모리에만 저장했습니다.')
      },
      publishAnswer: (answer) => {
        dispatch({ type: 'publish-answer', answer })
        setStatusNotice('답변을 등록했습니다. 브라우저 메모리에만 저장했습니다.')
      },
      toggleQuestionEmpathy: (questionId) => dispatch({ type: 'toggle-empathy', questionId }),
      completePrecheck: (precheck) => {
        dispatch({ type: 'complete-precheck', precheck })
        setStatusNotice('비대면 사전 확인을 마쳤습니다.')
      },
      requestEncounter: (questionId, doctorId) => {
        dispatch({ type: 'request-encounter', questionId, doctorId })
        setStatusNotice('진료 신청 의사를 전달했습니다. 실제 예약은 이루어지지 않습니다.')
      },
      resetDemo: () => {
        dispatch({ type: 'reset' })
        setStatusNotice('데모가 초기 상태로 복원됐습니다.')
      },
    }),
    [state, statusNotice],
  )

  return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>
}

export function useCommunity() {
  const context = useContext(CommunityContext)
  if (!context) throw new Error('useCommunity must be used within CommunityProvider')
  return context
}
