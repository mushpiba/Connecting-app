import { useLocation, useNavigate } from 'react-router-dom'
import { useCommunity } from '../state/CommunityContext'
import { AppIcon } from './AppIcon'

const patientTabs = [
  { path: '/home', label: '홈', icon: 'home' },
  { path: '/stories', label: '사연', icon: 'stories' },
  { path: '/ask', label: 'Q', icon: 'ask', primary: true },
  { path: '/news', label: '내소식', icon: 'news' },
  { path: '/me', label: 'MY', icon: 'me' },
] as const

const doctorTabs = [{ path: '/doctor/inbox', label: '받은 질문', icon: 'stories' }] as const

export function BottomNav() {
  const { state } = useCommunity()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const tabs = state.role === 'doctor' ? doctorTabs : patientTabs

  return (
    <nav className="bottom-nav" aria-label="주요 화면">
      {tabs.map((tab) => {
        const active = pathname === tab.path
        return (
          <button
            key={tab.path}
            type="button"
            className={`${active ? 'is-active' : ''} ${'primary' in tab && tab.primary ? 'is-primary' : ''}`}
            aria-label={tab.label}
            aria-current={active ? 'page' : undefined}
            onClick={() => navigate(tab.path)}
          >
            <span className="nav-icon-wrap">
              <AppIcon name={tab.icon} />
            </span>
            {'primary' in tab && tab.primary ? null : tab.label}
          </button>
        )
      })}
    </nav>
  )
}
