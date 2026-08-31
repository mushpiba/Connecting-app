import { useLocation, useNavigate } from 'react-router-dom'
import { useCommunity } from '../state/CommunityContext'
import { AppIcon } from './AppIcon'

/**
 * 넷 + 가운데 작성 버튼까지가 한계다. `사연` 탭은 홈이 그 역할을 가져가면서 빠졌고,
 * 그 자리에 `내 소식`이 헤더 종 아이콘에서 올라왔다 — 재방문의 이유가 「내 사연에
 * 답이 달렸는가」 하나뿐인데 그것을 부속 아이콘에 둘 수 없다. `지도`는 주변과 재진을
 * 함께 담는 `진료`로 넓어졌다.
 */
const patientTabs = [
  { path: '/home', label: '홈', icon: 'home' },
  { path: '/news', label: '내 소식', icon: 'news' },
  { path: '/ask', label: 'Q', icon: 'ask', primary: true },
  { path: '/care', label: '진료', icon: 'map' },
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
