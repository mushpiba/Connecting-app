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
  ExpressionFilterHit,
  PrivateMessage,
  PrivateThread,
  Question,
  QuestionNote,
  SelfReportedClinic,
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
  deleteSelfReportedClinic,
  fetchSnapshot,
  insertAnswer,
  insertBooking,
  insertEncounter,
  insertExpressionFilterHits,
  insertNote,
  insertPrivateMessage,
  insertPrivateThread,
  insertQuestion,
  insertSelfReportedClinic,
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
  /** 서버에 남은 진료 신청. 라이브가 아니면 비어 있다. */
  encounters: EncounterRequest[]
  bookings: BookingRequest[]
  notes: QuestionNote[]
  /** 환자가 손으로 적은 의료기관. 앱 내 이력과 섞지 않는다. */
  selfReportedClinics: SelfReportedClinic[]
  /** 비공개 덧붙임. 당사자 둘에게만 있다. */
  privateThreads: PrivateThread[]
  privateMessages: PrivateMessage[]
  /**
   * 표현 필터에 걸린 기록.
   *
   * **읽는 화면이 없는 것이 요건이다.** 라이브에서는 표로 나가고 여기 남지
   * 않는다. 데모에는 서버가 없어서 여기 담기지만 그리는 자리는 없다 — 담는
   * 이유는 데모에서도 「걸렀다는 사실」이 남아야 하기 때문이다.
   */
  expressionFilterHits: ExpressionFilterHit[]
}

export type CommunityAction =
  | { type: 'switch-role'; role: AppRole }
  | { type: 'switch-doctor'; doctorId: string }
  | { type: 'publish-question'; question: Question }
  | { type: 'publish-answer'; answer: Answer }
  | { type: 'toggle-empathy'; questionId: string }
  | { type: 'complete-precheck'; precheck: TelemedicinePrecheck }
  | { type: 'request-encounter'; encounter: EncounterRequest }
  | { type: 'set-encounter-status'; encounterId: string; status: EncounterRequestStatus }
  | { type: 'request-booking'; booking: BookingRequest }
  | { type: 'remove-question'; questionId: string }
  | { type: 'add-note'; note: QuestionNote }
  | { type: 'open-private-thread'; thread: PrivateThread }
  | { type: 'send-private-message'; message: PrivateMessage }
  | { type: 'log-filter-hits'; hits: ExpressionFilterHit[] }
  | { type: 'add-self-reported-clinic'; clinic: SelfReportedClinic }
  | { type: 'remove-self-reported-clinic'; id: string }
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
  encounters: [],
  bookings: [],
  notes: [],
  selfReportedClinics: [],
  privateThreads: [],
  privateMessages: [],
  expressionFilterHits: [],
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
    /**
     * 데모에도 신청을 기록으로 남긴다.
     *
     * 눌렀다는 사실만 담고 있었다. 그러면 의사 화면에는 아무 일도 일어나지 않고,
     * 상태 전이를 볼 자리 자체가 없다. 서버가 없을 뿐이지 신청은 일어난 일이다.
     *
     * 살아 있는 신청이 이미 있으면 두 번 담지 않는다. 거절된 것은 끝난 이야기라
     * 같은 자리에 새 신청을 낼 수 있다.
     */
    case 'request-encounter': {
      const { questionId, doctorId } = action.encounter
      const live = state.encounters.some(
        (item) =>
          item.questionId === questionId &&
          item.doctorId === doctorId &&
          item.status !== 'declined',
      )
      if (live) return state
      return {
        ...state,
        encounters: [
          ...state.encounters.filter((item) => item.id !== action.encounter.id),
          action.encounter,
        ],
      }
    }
    case 'set-encounter-status':
      return {
        ...state,
        encounters: state.encounters.map((item) =>
          item.id === action.encounterId ? { ...item, status: action.status } : item,
        ),
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
        selfReportedClinics: action.snapshot.selfReportedClinics,
        privateThreads: action.snapshot.privateThreads,
        privateMessages: action.snapshot.privateMessages,
      }
    /**
     * 사연을 지우면 그 위에 달린 답변과 덧붙임도 함께 사라진다. 비공개 대화도
     * 같이 간다 — 표의 cascade 와 같은 모양이고 삭제 확인 문구와도 같다.
     *
     * 걸린 기록(`expressionFilterHits`)은 남긴다. 방어 자료가 지워지는 대상을
     * 따라 사라지면 자료가 아니고, 표도 그래서 외래키를 걸지 않았다.
     */
    case 'remove-question': {
      const goneThreads = new Set(
        state.privateThreads
          .filter((item) => item.questionId === action.questionId)
          .map((item) => item.id),
      )
      return {
        ...state,
        questions: state.questions.filter((item) => item.id !== action.questionId),
        answers: state.answers.filter((item) => item.questionId !== action.questionId),
        notes: state.notes.filter((item) => item.questionId !== action.questionId),
        empathies: state.empathies.filter((item) => item.questionId !== action.questionId),
        privateThreads: state.privateThreads.filter(
          (item) => item.questionId !== action.questionId,
        ),
        privateMessages: state.privateMessages.filter((item) => !goneThreads.has(item.threadId)),
      }
    }
    case 'add-note':
      return { ...state, notes: [...state.notes, action.note] }
    /** 한 답변에 대화 하나. 이미 있으면 두 번 열지 않는다. */
    case 'open-private-thread': {
      const exists = state.privateThreads.some(
        (item) =>
          item.answerId === action.thread.answerId && item.patientId === action.thread.patientId,
      )
      if (exists) return state
      return { ...state, privateThreads: [...state.privateThreads, action.thread] }
    }
    /** 보낸 발화는 취소할 수 없다. 지우는 동작을 두지 않는다. */
    case 'send-private-message':
      return { ...state, privateMessages: [...state.privateMessages, action.message] }
    case 'log-filter-hits':
      return { ...state, expressionFilterHits: [...state.expressionFilterHits, ...action.hits] }
    case 'add-self-reported-clinic':
      return { ...state, selfReportedClinics: [...state.selfReportedClinics, action.clinic] }
    case 'remove-self-reported-clinic':
      return {
        ...state,
        selfReportedClinics: state.selfReportedClinics.filter((item) => item.id !== action.id),
      }
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
  /** 바뀌었으면 참. 실패했으면 화면이 진료방으로 넘어가지 않는다. */
  setEncounterStatus: (encounterId: string, status: EncounterRequestStatus) => Promise<boolean>
  requestBooking: (booking: BookingRequest) => void
  removeQuestion: (questionId: string) => void
  addNote: (questionId: string, body: string) => void
  /** 다니는 곳 직접 등록. 받는 것은 이름과 마지막 진료일 둘뿐이다. */
  addSelfReportedClinic: (name: string, lastVisitedOn: string) => void
  /** ⚠︎ 되돌릴 수 없다. 화면이 확인을 한 번 받는다. */
  removeSelfReportedClinic: (id: string) => void
  /**
   * 비공개 덧붙임을 연다. **환자만 부른다** — 의사 화면에는 부르는 자리가 없고
   * 서버에도 의사용 INSERT 정책이 없다 (D-6 항목 1).
   */
  openPrivateThread: (
    questionId: string,
    answerId: string,
    doctorId: string,
  ) => Promise<PrivateThread | null>
  /** ⚠︎ 보낸 발화는 취소할 수 없다. 왕복 1을 소모한다. */
  sendPrivateMessage: (threadId: string, role: AppRole, body: string) => void
  /**
   * 걸린 사실을 남긴다. **읽는 자리를 만들지 않는다** — 표에 SELECT 정책이 없고
   * 화면이 읽지 않는 것이 요건이다.
   */
  logExpressionHits: (hits: Omit<ExpressionFilterHit, 'id'>[]) => void
  resetDemo: () => void
  /**
   * 서버에서 읽는 중인가. 데모에서는 늘 false 다.
   *
   * 화면이 「불러오는 중」과 「비어 있음」을 구분하려면 이 값이 있어야 한다.
   * 둘을 못 가르면 초기 커뮤니티에서 잠깐의 지연이 「아무것도 없음」으로 보인다.
   */
  loading: boolean
  /** 마지막 읽기가 실패했는가. 화면이 구역별로 다시 불러오기를 낸다. */
  loadFailed: boolean
  reload: () => void
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
  return `${what} 못했습니다. 잠시 뒤 다시 시도해 주세요. 적은 내용은 그대로 있습니다.`
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
  // 라이브에서는 첫 스냅샷이 오기 전까지가 「불러오는 중」이다. 데모는 픽스처가
  // 이미 손에 있으므로 이 값이 켜질 일이 없다.
  const [loading, setLoading] = useState(isLiveMode)
  const [loadFailed, setLoadFailed] = useState(false)
  const { status, profile } = useSession()
  const ready = isLiveMode && status === 'ready' && profile !== null

  const reload = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    try {
      const snapshot = await fetchSnapshot()
      setLive(snapshot)
      dispatch({
        type: 'load-snapshot',
        snapshot,
        profileId: profile.id,
        role: profile.role,
      })
      setLoadFailed(false)
    } catch (error) {
      setLoadFailed(true)
      setStatusNotice(failureNotice('불러오지', error), 'error')
    } finally {
      setLoading(false)
    }
  }, [profile, setStatusNotice])

  useEffect(() => {
    if (!ready) {
      setLoading(false)
      return
    }
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
      /**
       * 저장이 끝난 뒤에 담는다. 먼저 담으면 실패했을 때도 버튼이 「신청함」으로
       * 굳어 다시 누를 수 없다.
       */
      requestEncounter: async (questionId, doctorId, clinicId) => {
        if (ready && profile) {
          try {
            const saved = await insertEncounter(questionId, profile.id, doctorId, clinicId)
            dispatch({ type: 'request-encounter', encounter: saved })
            await reload()
            setStatusNotice('진료를 신청했습니다. 의사가 열면 진료방으로 들어갑니다.')
            return saved
          } catch (error) {
            setStatusNotice(failureNotice('진료를 신청하지', error), 'error')
            return null
          }
        }

        const encounter: EncounterRequest = {
          id: `e-${questionId}-${doctorId}`,
          questionId,
          patientId: state.patientId,
          doctorId,
          clinicId,
          status: 'requested',
          createdAt: demoNowIso,
        }
        dispatch({ type: 'request-encounter', encounter })
        setStatusNotice('진료 신청 의사를 전달했습니다. 브라우저 메모리에만 저장했습니다.')
        return encounter
      },
      setEncounterStatus: async (encounterId, status) => {
        if (ready && profile) {
          try {
            await updateEncounterStatus(encounterId, status)
            await reload()
            return true
          } catch (error) {
            setStatusNotice(failureNotice('진료 상태를 바꾸지', error), 'error')
            return false
          }
        }
        dispatch({ type: 'set-encounter-status', encounterId, status })
        return true
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
      addSelfReportedClinic: (name, lastVisitedOn) => {
        if (ready && profile) {
          void insertSelfReportedClinic(profile.id, name, lastVisitedOn)
            .then(reload)
            .catch((error: Error) => setStatusNotice(failureNotice('다니는 곳을 더하지', error), 'error'))
        } else {
          dispatch({
            type: 'add-self-reported-clinic',
            clinic: {
              id: `self-local-${state.selfReportedClinics.length + 1}`,
              patientId: state.patientId,
              name,
              lastVisitedOn,
              trust: 'self-reported',
              createdAt: demoNowIso,
            },
          })
        }
        setStatusNotice('다니는 곳을 더했습니다.')
      },
      /**
       * 열고 나서 그 대화를 돌려준다. 화면이 곧바로 첫 발화를 넣어야 하는데,
       * 라이브에서는 서버가 새 id 를 만들기 때문에 임시 id 로 넣으면 없는
       * 대화에 말풍선이 붙는다. `publishQuestion` 과 같은 이유다.
       */
      openPrivateThread: async (questionId, answerId, doctorId) => {
        if (ready && profile) {
          try {
            const saved = await insertPrivateThread(questionId, answerId, profile.id, doctorId)
            await reload()
            return saved
          } catch (error) {
            setStatusNotice(failureNotice('비공개로 묻지', error), 'error')
            return null
          }
        }

        const thread: PrivateThread = {
          id: `pt-local-${state.privateThreads.length + 1}`,
          questionId,
          answerId,
          patientId: state.patientId,
          doctorId,
          createdAt: demoNowIso,
        }
        dispatch({ type: 'open-private-thread', thread })
        return thread
      },
      sendPrivateMessage: (threadId, role, body) => {
        const senderId = role === 'doctor' ? state.doctorId : state.patientId
        if (ready && profile) {
          void insertPrivateMessage(threadId, profile.id, role, body)
            .then(reload)
            .catch((error: Error) => setStatusNotice(failureNotice('보내지', error), 'error'))
        } else {
          dispatch({
            type: 'send-private-message',
            message: {
              id: `pm-local-${state.privateMessages.length + 1}`,
              threadId,
              senderId,
              senderRole: role,
              body,
              createdAt: demoNowIso,
            },
          })
        }
        setStatusNotice(
          role === 'doctor' ? '회신을 보냈습니다.' : '비공개로 물었습니다.',
        )
      },
      logExpressionHits: (hits) => {
        if (hits.length === 0) return
        if (ready && profile) {
          // 로그가 실패해도 전송은 이미 막혀 있다. 화면을 두 번 놀라게 하지
          // 않는다 — 걸린 이유는 이미 그 자리에 떠 있다.
          void insertExpressionFilterHits(hits).catch((error: Error) =>
            console.error('[MediVU] 걸린 기록을 남기지 못했습니다', error),
          )
          return
        }
        dispatch({
          type: 'log-filter-hits',
          hits: hits.map((hit, index) => ({
            ...hit,
            id: `fh-local-${state.expressionFilterHits.length + index + 1}`,
          })),
        })
      },
      removeSelfReportedClinic: (id) => {
        if (ready && profile) {
          void deleteSelfReportedClinic(id)
            .then(reload)
            .catch((error: Error) => setStatusNotice(failureNotice('다니는 곳을 지우지', error), 'error'))
        } else {
          dispatch({ type: 'remove-self-reported-clinic', id })
        }
        setStatusNotice('다니는 곳을 지웠습니다.')
      },
      resetDemo: () => {
        dispatch({ type: 'reset' })
        setStatusNotice('데모가 초기 상태로 복원됐습니다.')
      },
      live,
      loading,
      loadFailed,
      reload: () => {
        void reload()
      },
    }),
    [
      state,
      statusNotice,
      statusTone,
      setStatusNotice,
      live,
      loading,
      loadFailed,
      ready,
      profile,
      reload,
    ],
  )

  return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>
}

export function useCommunity() {
  const context = useContext(CommunityContext)
  if (!context) throw new Error('useCommunity must be used within CommunityProvider')
  return context
}
