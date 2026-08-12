import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { toggleEmpathy } from '../domain/board'
import type {
  Answer,
  AppRole,
  BookingRequest,
  Empathy,
  EncounterRequest,
  EncounterRequestStatus,
  Question,
  QuestionNote,
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
  deleteQuestion,
  fetchSnapshot,
  insertAnswer,
  insertBooking,
  insertEncounter,
  insertNote,
  insertQuestion,
  setEmpathy,
  subscribeToChanges,
  updateEncounterStatus,
} from '../data/liveRepository'
import { clearLocal, readLocal, writeLocal } from './localStore'
import { hasEmpathized } from '../domain/board'
import { useSession } from './SessionContext'
import type { LiveSnapshot } from '../data/liveRepository'

export interface CommunityState {
  role: AppRole
  /**
   * 사람이 직접 화면을 바꿨는가.
   *
   * 서버에서 스냅샷을 다시 읽을 때마다 계정 역할로 화면을 되돌리고 있었다.
   * 사연을 하나 올리면 곧바로 다시 읽으므로, 의사 계정으로 환자 화면을 보던
   * 사람이 글을 쓰는 도중 의사 화면으로 튕겼다. 직접 고른 화면은 그대로 둔다.
   *
   * 새로 열면 다시 풀린다. 그때는 계정 역할을 따라가는 편이 맞다.
   */
  roleLocked: boolean
  patientId: string
  doctorId: string
  questions: Question[]
  answers: Answer[]
  empathies: Empathy[]
  precheck: TelemedicinePrecheck
  requestedEncounterIds: string[]
  /** 서버에 남은 진료 신청. 라이브가 아니면 비어 있다. */
  encounters: EncounterRequest[]
  bookings: BookingRequest[]
  notes: QuestionNote[]
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
  | { type: 'remove-question'; questionId: string }
  | { type: 'add-note'; note: QuestionNote }
  | { type: 'load-snapshot'; snapshot: LiveSnapshot; profileId: string; role: AppRole }
  | { type: 'reset' }

/** 새로고침해도 사전 확인이 남아야 한다. 기기 밖으로는 나가지 않는다. */
const PRECHECK_KEY = 'medivu.precheck'

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
  roleLocked: false,
  patientId: demoCurrentPatientId,
  doctorId: demoDoctors[0].id,
  questions: demoQuestions,
  answers: demoAnswers,
  empathies: demoEmpathies,
  precheck: readLocal(PRECHECK_KEY, initialPrecheck),
  requestedEncounterIds: [],
  encounters: [],
  bookings: [],
  notes: [],
}

export function communityReducer(
  state: CommunityState,
  action: CommunityAction,
): CommunityState {
  switch (action.type) {
    case 'switch-role':
      return { ...state, role: action.role, roleLocked: true }
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
      writeLocal(PRECHECK_KEY, action.precheck)
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
        role: state.roleLocked ? state.role : action.role,
        patientId: action.profileId,
        doctorId: action.role === 'doctor' ? action.profileId : state.doctorId,
        questions: action.snapshot.questions,
        answers: action.snapshot.answers,
        empathies: action.snapshot.empathies,
        bookings: action.snapshot.bookings,
        notes: action.snapshot.notes,
        encounters: action.snapshot.encounters,
      }
    /** 사연을 지우면 그 위에 달린 답변과 덧붙임도 함께 사라진다. */
    case 'remove-question':
      return {
        ...state,
        questions: state.questions.filter((item) => item.id !== action.questionId),
        answers: state.answers.filter((item) => item.questionId !== action.questionId),
        notes: state.notes.filter((item) => item.questionId !== action.questionId),
        empathies: state.empathies.filter((item) => item.questionId !== action.questionId),
      }
    case 'add-note':
      return { ...state, notes: [...state.notes, action.note] }
    case 'reset':
      clearLocal(PRECHECK_KEY)
      return { ...initialCommunityState, precheck: initialPrecheck, roleLocked: false }
    default:
      return state
  }
}

interface CommunityContextValue {
  state: CommunityState
  statusNotice: string
  /** 실패인지 알림인지. 화면이 색과 강조를 다르게 준다. */
  statusTone: StatusTone
  switchRole: (role: AppRole) => void
  switchDoctor: (doctorId: string) => void
  publishQuestion: (question: Question) => Promise<Question>
  publishAnswer: (answer: Answer) => void
  toggleQuestionEmpathy: (questionId: string) => void
  completePrecheck: (precheck: TelemedicinePrecheck) => void
  /** 서버에 신청을 남기고 그 신청을 돌려준다. id 가 곧 진료방 주소다. */
  requestEncounter: (
    questionId: string,
    doctorId: string,
    clinicId: string,
  ) => Promise<EncounterRequest | null>
  setEncounterStatus: (encounterId: string, status: EncounterRequestStatus) => void
  requestBooking: (booking: BookingRequest) => void
  removeQuestion: (questionId: string) => void
  addNote: (questionId: string, body: string) => void
  resetDemo: () => void
  /** 라이브 모드에서만 채워진다. 화면은 없으면 데모 픽스처를 쓴다. */
  live: LiveSnapshot | null
}

export type StatusTone = 'info' | 'error'

/**
 * 실패를 사람 말로 바꾼다.
 *
 * 데이터베이스가 뱉은 원문을 그대로 띄우면 읽는 사람은 무엇을 해야 할지 모르고,
 * 테이블과 열 이름까지 같이 나간다. 원문은 콘솔로 보낸다.
 */
function failureNotice(what: string, error: unknown): string {
  if (error instanceof Error) console.error(`[MediVU] ${what} 실패`, error)
  return `${what} 실패했습니다. 잠시 뒤 다시 시도해 주세요. 적은 내용은 그대로 있습니다.`
}

const CommunityContext = createContext<CommunityContextValue | null>(null)

export function CommunityProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(communityReducer, initialCommunityState)
  const [statusNotice, setNotice] = useState('')
  const [statusTone, setStatusTone] = useState<StatusTone>('info')

  const setStatusNotice = useCallback((message: string, tone: StatusTone = 'info') => {
    setNotice(message)
    setStatusTone(tone)
  }, [])
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
      setStatusNotice(failureNotice('불러오지', error), 'error')
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
      statusTone,
      switchRole: (role) => {
        dispatch({ type: 'switch-role', role })
        setStatusNotice(role === 'doctor' ? '의사 화면으로 전환했습니다.' : '환자 화면으로 전환했습니다.')
      },
      switchDoctor: (doctorId) => dispatch({ type: 'switch-doctor', doctorId }),
      /**
       * 저장된 사연을 돌려준다. 라이브에서는 서버가 새 id를 만들기 때문에
       * 화면이 들고 있던 임시 id로 이동하면 없는 글을 열게 된다.
       */
      publishQuestion: async (question) => {
        if (ready && profile) {
          try {
            const saved = await insertQuestion(question, profile.id)
            await reload()
            setStatusNotice('사연을 올렸습니다.')
            return saved
          } catch (error) {
            setStatusNotice(failureNotice('사연을 올리지', error), 'error')
            throw error
          }
        }
        dispatch({ type: 'publish-question', question })
        setStatusNotice('질문을 등록했습니다. 브라우저 메모리에만 저장했습니다.')
        return question
      },
      publishAnswer: (answer) => {
        if (ready && profile) {
          void insertAnswer(answer.questionId, profile.id, answer.body)
            .then(reload)
            .catch((error: Error) => setStatusNotice(failureNotice('답변을 등록하지', error), 'error'))
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
            .catch((error: Error) => setStatusNotice(failureNotice('공감을 전하지', error), 'error'))
          return
        }
        dispatch({ type: 'toggle-empathy', questionId })
      },
      completePrecheck: (precheck) => {
        dispatch({ type: 'complete-precheck', precheck })
        setStatusNotice('비대면 사전 확인을 마쳤습니다.')
      },
      requestEncounter: async (questionId, doctorId, clinicId) => {
        dispatch({ type: 'request-encounter', questionId, doctorId })
        if (ready && profile) {
          try {
            const encounter = await insertEncounter(questionId, profile.id, doctorId, clinicId)
            await reload()
            setStatusNotice('진료를 신청했습니다. 의사가 열면 진료방으로 들어갑니다.')
            return encounter
          } catch (error) {
            setStatusNotice(failureNotice('진료를 신청하지', error), 'error')
            return null
          }
        }
        setStatusNotice('진료 신청 의사를 전달했습니다. 브라우저 메모리에만 저장했습니다.')
        return null
      },
      setEncounterStatus: (encounterId, status) => {
        if (ready && profile) {
          void updateEncounterStatus(encounterId, status)
            .then(reload)
            .catch((error: Error) => setStatusNotice(failureNotice('진료 상태를 바꾸지', error), 'error'))
        }
      },
      requestBooking: (booking) => {
        if (ready && profile) {
          void insertBooking(booking, profile.id)
            .then(reload)
            .catch((error: Error) => setStatusNotice(failureNotice('희망 시간을 전달하지', error), 'error'))
          setStatusNotice('희망 시간을 전달했습니다. 실제 예약은 병원이 확인해야 확정됩니다.')
          return
        }
        dispatch({ type: 'request-booking', booking })
        setStatusNotice('희망 시간을 전달했습니다. 실제 예약은 병원이 확인해야 확정됩니다.')
      },
      removeQuestion: (questionId) => {
        if (ready && profile) {
          void deleteQuestion(questionId)
            .then(reload)
            .catch((error: Error) => setStatusNotice(failureNotice('사연을 지우지', error), 'error'))
        } else {
          dispatch({ type: 'remove-question', questionId })
        }
        setStatusNotice('사연을 삭제했습니다.')
      },
      addNote: (questionId, body) => {
        if (ready && profile) {
          void insertNote(questionId, profile.id, body)
            .then(reload)
            .catch((error: Error) => setStatusNotice(failureNotice('덧붙이지', error), 'error'))
        } else {
          dispatch({
            type: 'add-note',
            note: {
              id: `note-local-${state.notes.length + 1}`,
              questionId,
              authorId: state.patientId,
              body,
              createdAt: demoNowIso,
            },
          })
        }
        setStatusNotice('덧붙였습니다.')
      },
      resetDemo: () => {
        dispatch({ type: 'reset' })
        setStatusNotice('데모가 초기 상태로 복원됐습니다.')
      },
      live,
    }),
    [state, statusNotice, statusTone, setStatusNotice, live, ready, profile, reload],
  )

  return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>
}

export function useCommunity() {
  const context = useContext(CommunityContext)
  if (!context) throw new Error('useCommunity must be used within CommunityProvider')
  return context
}
