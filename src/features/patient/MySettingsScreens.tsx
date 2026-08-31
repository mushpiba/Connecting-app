import { nowIso, todayIso } from '../../data/appClock'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { demoRegions } from '../../data/demoClinics'
import { usePatientSettings } from '../../state/PatientSettingsContext'
import type { PostVisibility } from '../../domain/types'

function SettingsHeader({ title }: { title: string }) {
  const navigate = useNavigate()

  return (
    <header className="settings-header">
      <button type="button" className="text-action" onClick={() => navigate('/me')}>
        ← MY로 돌아가기
      </button>
      <h1>{title}</h1>
    </header>
  )
}

function SavedNotice({ children }: { children: string }) {
  return <p className="settings-saved" role="status">{children}</p>
}

export function AddressSettingsScreen() {
  const { settings, updateSettings } = usePatientSettings()
  const [region, setRegion] = useState(settings.address.region)
  const [detail, setDetail] = useState(settings.address.detail)
  const [saved, setSaved] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    updateSettings({ address: { region, detail, savedAt: nowIso() } }, '주소를 저장했습니다.')
    setSaved(true)
  }

  return (
    <div className="screen settings-screen">
      <SettingsHeader title="주소 설정" />
      <form className="settings-form" onSubmit={submit}>
        <label>
          기본 지역
          <select value={region} onChange={(event) => setRegion(event.target.value)}>
            {demoRegions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label>
          상세 주소 별칭 (선택)
          <input
            value={detail}
            placeholder="예: 집, 회사"
            onChange={(event) => setDetail(event.target.value)}
          />
        </label>
        <p className="settings-note">
          지역만 고르고 저장해도 됩니다. 별칭은 여러 곳을 구분할 때만 씁니다. 주소 확인과 병원
          전송은 아직 연결되지 않은 데모이니 실제 상세 주소는 적지 마세요.
        </p>
        <button type="submit" className="primary-cta">주소 저장</button>
        {saved && <SavedNotice>주소를 저장했습니다.</SavedNotice>}
      </form>
    </div>
  )
}

export function NotificationSettingsScreen() {
  const { settings, updateSettings } = usePatientSettings()
  const [notifications, setNotifications] = useState(settings.notifications)
  const [saved, setSaved] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    updateSettings({ notifications }, '알림 설정을 저장했습니다.')
    setSaved(true)
  }

  const toggle = (key: keyof typeof notifications) => {
    setNotifications((current) => ({ ...current, [key]: !current[key] }))
  }

  return (
    <div className="screen settings-screen">
      <SettingsHeader title="알림 설정" />
      <form className="settings-form" onSubmit={submit}>
        <fieldset className="setting-options">
          <legend>받을 알림</legend>
          <label className="setting-option">
            <input type="checkbox" checked={notifications.answers} onChange={() => toggle('answers')} />
            <span>답변 도착 알림</span>
          </label>
          <label className="setting-option">
            <input type="checkbox" checked={notifications.bookings} onChange={() => toggle('bookings')} />
            <span>예약 진행 알림</span>
          </label>
          <label className="setting-option">
            <input type="checkbox" checked={notifications.service} onChange={() => toggle('service')} />
            <span>서비스 안내 알림</span>
          </label>
        </fieldset>
        <p className="settings-note">푸시 권한 요청과 실제 알림 발송은 아직 연결되지 않은 데모입니다.</p>
        <button type="submit" className="primary-cta">알림 설정 저장</button>
        {saved && <SavedNotice>알림 설정을 저장했습니다.</SavedNotice>}
      </form>
    </div>
  )
}

const visibilityOptions: Array<{ id: PostVisibility; label: string }> = [
  { id: 'public', label: '모든 사용자에게 공개' },
  { id: 'specialty-only', label: '관련 진료과 의사에게만' },
  { id: 'prior-clinic-only', label: '이전에 방문한 병원에게만' },
]

export function PrivacySettingsScreen() {
  const { settings, updateSettings } = usePatientSettings()
  const [defaultVisibility, setDefaultVisibility] = useState(settings.defaultVisibility)
  const [showProfile, setShowProfile] = useState(settings.showProfile)
  const [saved, setSaved] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    updateSettings({ defaultVisibility, showProfile }, '개인정보 설정을 저장했습니다.')
    setSaved(true)
  }

  return (
    <div className="screen settings-screen">
      <SettingsHeader title="개인정보 설정" />
      <form className="settings-form" onSubmit={submit}>
        <fieldset className="setting-options">
          <legend>새 질문 기본 공개 범위</legend>
          {visibilityOptions.map((option) => (
            <label className="setting-option" key={option.id}>
              <input
                type="radio"
                name="default-visibility"
                checked={defaultVisibility === option.id}
                onChange={() => setDefaultVisibility(option.id)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>
        <label className="setting-option standalone-option">
          <input type="checkbox" checked={showProfile} onChange={() => setShowProfile((value) => !value)} />
          <span>프로필 이름 표시</span>
        </label>
        <p className="settings-note">실제 동의 기록이나 서버 공개 범위에는 아직 반영되지 않는 데모입니다.</p>
        <button type="submit" className="primary-cta">개인정보 설정 저장</button>
        {saved && <SavedNotice>개인정보 설정을 저장했습니다.</SavedNotice>}
      </form>
    </div>
  )
}
