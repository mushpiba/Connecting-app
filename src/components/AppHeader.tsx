import { useNavigate } from 'react-router-dom'
import { useCommunity } from '../state/CommunityContext'

export function AppHeader() {
  const { state, statusNotice, switchRole, resetDemo } = useCommunity()
  const navigate = useNavigate()

  const goPatient = () => {
    switchRole('patient')
    navigate('/home')
  }

  const goDoctor = () => {
    switchRole('doctor')
    navigate('/doctor/inbox')
  }

  return (
    <header className="app-header">
      <div className="app-header-row">
        <span className="brand-block">
          <span className="brand">MediVU</span>
          <span className="brand-tagline">증상 질문에서 진료까지</span>
        </span>
        <div className="header-controls">
          <nav className="role-switch" aria-label="역할 전환">
            <button
              type="button"
              className={state.role === 'patient' ? 'is-active' : ''}
              aria-pressed={state.role === 'patient'}
              onClick={goPatient}
            >
              환자
            </button>
            <button
              type="button"
              className={state.role === 'doctor' ? 'is-active' : ''}
              aria-pressed={state.role === 'doctor'}
              onClick={goDoctor}
            >
              의사
            </button>
          </nav>
          <button
            type="button"
            className="reset-button"
            aria-label="데모 초기화"
            onClick={resetDemo}
          >
            <span aria-hidden="true">↻</span> 초기화
          </button>
        </div>
      </div>
      <p className="app-header-caveat">
        가상 데이터로 만든 클릭형 데모입니다. 진단이 아니며 서버로 전송되지 않습니다.
      </p>
      <span className="visually-hidden" role="status">
        {statusNotice}
      </span>
    </header>
  )
}
