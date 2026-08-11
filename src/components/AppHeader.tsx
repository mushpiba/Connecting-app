import { useNavigate } from 'react-router-dom'
import { useCommunity } from '../state/CommunityContext'
import { AppIcon } from './AppIcon'

export function AppHeader() {
  const { state, statusNotice, switchRole } = useCommunity()
  const navigate = useNavigate()

  const goPatient = () => {
    switchRole('patient')
    navigate('/home')
  }

  return (
    <header className="app-header">
      <div className="app-header-row">
        <button type="button" className="brand-block" aria-label="MediVU 홈" onClick={goPatient}>
          <span className="brand">MediVU</span>
          <span className="demo-badge">DEMO</span>
        </button>
        <div className="header-controls">
          {state.role === 'patient' && (
            <button
              type="button"
              className="header-icon-button"
              aria-label="내소식"
              onClick={() => navigate('/news')}
            >
              <AppIcon name="news" />
            </button>
          )}
          {state.role === 'patient' ? (
            <button
              type="button"
              className="expert-button"
              onClick={() => navigate('/expert')}
            >
              expert
            </button>
          ) : (
            <button
              type="button"
              className="patient-return-button"
              onClick={goPatient}
            >
              환자 화면
            </button>
          )}
        </div>
      </div>
      <span className="visually-hidden" role="status">
        {statusNotice}
      </span>
    </header>
  )
}
