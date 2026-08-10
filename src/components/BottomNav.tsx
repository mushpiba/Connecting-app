import { useLocation, useNavigate } from 'react-router-dom'
import { useCommunity } from '../state/CommunityContext'

const patientTabs = [
  { path: '/home', label: '홈', glyph: '⌂' },
  { path: '/board', label: '게시판', glyph: '▤' },
  { path: '/ask', label: '질문하기', glyph: '✚' },
  { path: '/me', label: '마이', glyph: '☺' },
]

const doctorTabs = [{ path: '/doctor/inbox', label: '받은 질문', glyph: '▤' }]

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
            className={active ? 'is-active' : ''}
            aria-current={active ? 'page' : undefined}
            onClick={() => navigate(tab.path)}
          >
            <span aria-hidden="true">{tab.glyph}</span>
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
