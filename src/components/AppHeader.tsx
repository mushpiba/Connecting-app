import { useNavigate } from 'react-router-dom'
import { useCommunity } from '../state/CommunityContext'

export function AppHeader() {
  const { state, switchRole } = useCommunity()
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
    </header>
  )
}
