import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { findClinic } from '../../data/demoClinics'
import { findDoctor } from '../../data/demoDoctors'
import { useCommunity } from '../../state/CommunityContext'
import { usePatientSettings } from '../../state/PatientSettingsContext'
import type { DemoPaymentMethodId } from '../../state/PatientSettingsContext'
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
    updateSettings({ address: { region, detail } }, '주소를 저장했습니다.')
    setSaved(true)
  }

  return (
    <div className="screen settings-screen">
      <SettingsHeader title="주소 설정" />
      <form className="settings-form" onSubmit={submit}>
        <label>
          기본 지역
          <select value={region} onChange={(event) => setRegion(event.target.value)}>
            <option>인천 미추홀구</option>
            <option>서울 성동구</option>
            <option>서울 마포구</option>
          </select>
        </label>
        <label>
          상세 주소 별칭
          <input
            value={detail}
            placeholder="예: 집, 회사"
            onChange={(event) => setDetail(event.target.value)}
          />
        </label>
        <p className="settings-note">
          주소 확인과 병원 전송은 아직 연결되지 않은 데모입니다. 실제 상세 주소는 저장하지 마세요.
        </p>
        <button type="submit" className="primary-cta">주소 저장</button>
        {saved && <SavedNotice>주소를 저장했습니다.</SavedNotice>}
      </form>
    </div>
  )
}

const paymentMethods: Array<{ id: DemoPaymentMethodId; label: string }> = [
  { id: 'none', label: '등록하지 않음' },
  { id: 'demo-hana', label: '하나카드 •••• 0616' },
  { id: 'demo-kakao', label: '카카오페이 데모' },
]

export function PaymentSettingsScreen() {
  const { settings, updateSettings } = usePatientSettings()
  const [paymentMethodId, setPaymentMethodId] = useState(settings.paymentMethodId)
  const [saved, setSaved] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    updateSettings({ paymentMethodId }, '결제수단을 저장했습니다.')
    setSaved(true)
  }

  return (
    <div className="screen settings-screen">
      <SettingsHeader title="결제수단 설정" />
      <form className="settings-form" onSubmit={submit}>
        <fieldset className="setting-options">
          <legend>결제수단 선택</legend>
          {paymentMethods.map((method) => (
            <label className="setting-option" key={method.id}>
              <input
                type="radio"
                name="payment-method"
                value={method.id}
                checked={paymentMethodId === method.id}
                onChange={() => setPaymentMethodId(method.id)}
              />
              <span>{method.label}</span>
            </label>
          ))}
        </fieldset>
        <p className="settings-note">
          표시된 수단은 시연용이며 실제 카드 번호·CVC를 입력하거나 결제하지 않습니다.
        </p>
        <button type="submit" className="primary-cta">결제수단 저장</button>
        {saved && <SavedNotice>결제수단을 저장했습니다.</SavedNotice>}
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

export function AppointmentsScreen() {
  const { state } = useCommunity()
  const navigate = useNavigate()

  return (
    <div className="screen settings-screen">
      <SettingsHeader title="예약 내역" />
      {state.bookings.length === 0 ? (
        <div className="settings-empty">
          <strong>전달한 예약 희망 시간이 없습니다.</strong>
          <p>의사 프로필에서 대면 진료 희망 시간을 선택하면 여기에 표시됩니다.</p>
        </div>
      ) : (
        <div className="appointment-list">
          {[...state.bookings].reverse().map((booking) => {
            const doctor = findDoctor(booking.doctorId)
            const clinic = findClinic(booking.clinicId)
            return (
              <article className="appointment-card" key={booking.id}>
                <span className="status-chip">예약 확정 전</span>
                <h2>{clinic?.name ?? '가상 병원'}</h2>
                <p>{booking.date} · {booking.time}</p>
                <small>{doctor?.name ?? '가상 의사'}에게 희망 시간을 전달했습니다.</small>
                <button type="button" className="secondary-button" onClick={() => navigate(`/doctors/${booking.doctorId}`)}>
                  의사 프로필 보기
                </button>
              </article>
            )
          })}
        </div>
      )}
      <p className="settings-note">병원이 확인하기 전까지 예약은 확정되지 않습니다.</p>
    </div>
  )
}
