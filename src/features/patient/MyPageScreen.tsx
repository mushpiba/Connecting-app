import { useNavigate } from 'react-router-dom'
import { AppIcon } from '../../components/AppIcon'
import { demoPatients } from '../../data/demoQuestions'
import { carePrepProgress } from '../../domain/carePrep'
import { isPrecheckComplete } from '../../domain/telemedicine'
import { useCommunity } from '../../state/CommunityContext'
import { usePatientSettings } from '../../state/PatientSettingsContext'

export function MyPageScreen() {
  const { state, resetDemo } = useCommunity()
  const { settings, resetSettings } = usePatientSettings()
  const navigate = useNavigate()
  const patient = demoPatients.find((item) => item.id === state.patientId)
  const mine = state.questions.filter((question) => question.patientId === state.patientId)
  const mineIds = new Set(mine.map((question) => question.id))
  const answerCount = state.answers.filter((answer) => mineIds.has(answer.questionId)).length
  const precheckComplete = isPrecheckComplete(state.precheck)
  const prep = carePrepProgress(state.precheck, settings.address.savedAt !== null)
  const resetAll = () => {
    resetDemo()
    resetSettings()
  }

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

      <nav className="my-shortcuts" aria-label="바로가기">
        <button type="button" onClick={() => navigate('/news')}>
          <AppIcon name="stories" />
          내 사연
        </button>
        <button type="button" onClick={() => navigate('/news')}>
          <AppIcon name="news" />
          내소식
        </button>
        <button type="button" onClick={() => navigate('/care')}>
          <AppIcon name="map" />
          내 주변 병원
        </button>
      </nav>

      <section className="prep-progress" aria-labelledby="prep-progress-heading">
        <div className="prep-progress-head">
          <h2 id="prep-progress-heading">비대면 진료 준비</h2>
          <span>{prep.doneCount} / {prep.total} 완료</span>
        </div>
        <div
          className="prep-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={prep.percent}
          aria-label={`비대면 진료 준비 ${prep.percent}퍼센트`}
        >
          <span style={{ width: `${prep.percent}%` }} />
        </div>
        <ul className="prep-steps">
          {prep.steps.map((step) => (
            <li key={step.id} className={step.done ? 'is-done' : ''}>
              <span aria-hidden="true">{step.done ? '✓' : '○'}</span>
              {step.label}
            </li>
          ))}
        </ul>
        {!prep.complete && (
          <button type="button" className="primary-cta" onClick={() => navigate('/me/precheck')}>
            남은 항목 채우기
          </button>
        )}
      </section>

      <div className="my-stats" aria-label="활동 요약">
        <button type="button" aria-label={`내 사연 ${mine.length}건`} onClick={() => navigate('/news')}>
          <strong>{mine.length}</strong>
          <span>내 사연</span>
        </button>
        <button type="button" aria-label={`받은 답변 ${answerCount}건`} onClick={() => navigate('/news')}>
          <strong>{answerCount}</strong>
          <span>받은 답변</span>
        </button>
      </div>

      <h2 className="my-section-title">진료 준비</h2>
      <section className="my-menu" aria-label="진료 준비 메뉴">
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
        <button type="button" aria-label="주소 설정" onClick={() => navigate('/me/address')}>
          <span>
            <strong>주소 설정</strong>
            <small>{settings.address.region}{settings.address.detail ? ` · ${settings.address.detail}` : ''}</small>
          </span>
          <span aria-hidden="true">›</span>
        </button>
        <button type="button" aria-label="예약 내역" onClick={() => navigate('/care')}>
          <span>
            <strong>예약 내역</strong>
            <small>{state.bookings.length > 0 ? `전달한 희망 시간 ${state.bookings.length}건` : '전달한 희망 시간 없음'}</small>
          </span>
          <span aria-hidden="true">›</span>
        </button>
      </section>

      <h2 className="my-section-title">앱 설정</h2>
      <section className="my-menu" aria-label="앱 설정 메뉴">
        <button type="button" aria-label="알림 설정" onClick={() => navigate('/me/notifications')}>
          <span>
            <strong>알림 설정</strong>
            <small>답변·예약 소식 알림 선택</small>
          </span>
          <span aria-hidden="true">›</span>
        </button>
        <button type="button" aria-label="개인정보 설정" onClick={() => navigate('/me/privacy')}>
          <span>
            <strong>개인정보 설정</strong>
            <small>질문 공개 범위와 프로필 표시</small>
          </span>
          <span aria-hidden="true">›</span>
        </button>
        <button
          type="button"
          aria-label="앱 사용법 다시 보기"
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
        <button type="button" className="secondary-cta" onClick={resetAll}>
          데모 초기화
        </button>
      </section>
    </div>
  )
}
