import { useLocation, useNavigate } from 'react-router-dom'
import { useCommunity } from '../state/CommunityContext'
import { AppIcon } from './AppIcon'

/**
 * 하단 탭은 넷 + 가운데 작성 버튼까지가 한계다. 지도를 넣으면서 내소식을 뺐다.
 * 홈이 답변 도착을 최상단에 띄우고 헤더 종 아이콘이 내소식으로 가므로
 * 들어갈 길은 그대로 둘 이상 남는다.
 */
const patientTabs = [
  { path: '/home', label: '홈', icon: 'home' },
  { path: '/stories', label: '사연', icon: 'stories' },
  { path: '/ask', label: 'Q', icon: 'ask', primary: true },
  { path: '/map', label: '지도', icon: 'map' },
  { path: '/me', label: 'MY', icon: 'me' },
] as const

/**
 * 의사는 매일 답변하고 진료한다. 설정은 한 번 정하고 두는 것이라 MY 안에 넣는다.
 * 하단에 설정 버튼을 늘어놓으면 정작 일하는 화면이 밀린다.
 */
const doctorTabs = [
  { path: '/doctor/home', label: '홈', icon: 'home' },
  { path: '/doctor/inbox', label: '받은 질문', icon: 'news' },
  { path: '/doctor/stories', label: '사연', icon: 'stories' },
  { path: '/doctor/visits', label: '진료', icon: 'calendar' },
  { path: '/doctor/me', label: 'MY', icon: 'me' },
] as const

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
