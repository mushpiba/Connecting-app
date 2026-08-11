import { useNavigate } from 'react-router-dom'
import { demoPatients } from '../../data/demoQuestions'
import { isPrecheckComplete } from '../../domain/telemedicine'
import { useCommunity } from '../../state/CommunityContext'

export function MyPageScreen() {
  const { state, resetDemo } = useCommunity()
  const navigate = useNavigate()
  const patient = demoPatients.find((item) => item.id === state.patientId)
  const mine = state.questions.filter((question) => question.patientId === state.patientId)
  const mineIds = new Set(mine.map((question) => question.id))
  const answerCount = state.answers.filter((answer) => mineIds.has(answer.questionId)).length
  const precheckComplete = isPrecheckComplete(state.precheck)

  return (
    <div className="screen my-screen">
      <h1>MY</h1>

      <section className="profile-summary" aria-label="프로필 요약">
        <span className="profile-avatar" aria-hidden="true">민</span>
        <div>
          <strong>{patient?.displayName ?? 'MediVU 사용자'}</strong>
          <p>{patient?.region ?? state.precheck.region}</p>
        </div>
      </section>

      <div className="my-stats" aria-label="활동 요약">
        <button type="button" onClick={() => navigate('/news')}>
          <strong>{mine.length}</strong>
          <span>내 사연 {mine.length}</span>
        </button>
        <button type="button" onClick={() => navigate('/news')}>
          <strong>{answerCount}</strong>
          <span>받은 답변 {answerCount}</span>
        </button>
      </div>

      <section className="my-menu" aria-label="MY 메뉴">
        <button
          type="button"
          aria-label="비대면 진료 사전 확인"
          onClick={() => navigate('/me/precheck')}
        >
          <span>
            <strong>비대면 진료 사전 확인</strong>
            <small>{precheckComplete ? '확인 완료' : '진료 연결 전에 확인해 주세요'}</small>
          </span>
          <span aria-hidden="true">›</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/onboarding', { state: { returnTo: '/me' } })}
        >
          <span>
            <strong>앱 사용법 다시 보기</strong>
            <small>사연부터 진료 연결까지 3단계로 안내합니다</small>
          </span>
          <span aria-hidden="true">›</span>
        </button>
      </section>

      <section className="demo-settings" aria-labelledby="demo-settings-heading">
        <h2 id="demo-settings-heading">설정</h2>
        <p>질문·답변·사전 확인을 시연 시작 상태로 되돌립니다.</p>
        <button type="button" className="secondary-cta" onClick={resetDemo}>
          데모 초기화
        </button>
      </section>
    </div>
  )
}
