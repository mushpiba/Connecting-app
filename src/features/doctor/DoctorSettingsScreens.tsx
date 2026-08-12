import { nowIso, todayIso } from '../../data/appClock'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppIcon } from '../../components/AppIcon'
import { ClinicMap } from '../../components/ClinicMap'
import { ClinicSchedule } from '../../components/ClinicSchedule'
import { DoctorPortrait } from '../../components/DoctorPortrait'
import { bandLabels } from '../../domain/documents'
import { useCommunity } from '../../state/CommunityContext'
import { useDirectory } from '../../state/directory'
import { useDoctorSettings } from '../../state/DoctorSettingsContext'
import { useSession } from '../../state/SessionContext'
import type { SlotBand } from '../../domain/types'

function SettingsHeader({ title }: { title: string }) {
  const navigate = useNavigate()
  return (
    <div className="ask-header">
      <button type="button" aria-label="뒤로" onClick={() => navigate('/doctor/me')}>
        <span aria-hidden="true">‹</span>
      </button>
      <h1>{title}</h1>
      <span aria-hidden="true" />
    </div>
  )
}

function useCurrentDoctor() {
  const { state } = useCommunity()
  const { doctors, findDoctor, findClinic } = useDirectory()
  const doctor = findDoctor(state.doctorId) ?? doctors[0]
  return { doctor, clinic: findClinic(doctor.clinicId) }
}

/** 설정을 한자리에 모은다. 매일 여는 화면이 아니라 한 번 정하고 두는 것들이다. */
export function DoctorMyScreen() {
  const { doctor, clinic } = useCurrentDoctor()
  const { settingsOf, notice } = useDoctorSettings()
  const { becomePatient } = useSession()
  const { switchRole } = useCommunity()
  const navigate = useNavigate()
  const settings = settingsOf(doctor.id, doctor.templateId)

  const toPatient = async () => {
    await becomePatient()
    switchRole('patient')
    navigate('/home')
  }

  return (
    <div className="screen my-screen">
      <h1>MY</h1>

      <section className="profile-summary" aria-label="프로필 요약">
        <DoctorPortrait doctor={doctor} size={56} />
        <div>
          <strong>{doctor.name}</strong>
          <p>{clinic?.name}</p>
        </div>
      </section>

      <h2 className="my-section-title">진료 설정</h2>
      <section className="my-menu" aria-label="진료 설정 메뉴">
        <button type="button" onClick={() => navigate('/doctor/me/profile')}>
          <span>
            <strong>프로필 설정</strong>
            <small>병원 위치와 진료 시간, 자기소개</small>
          </span>
          <span aria-hidden="true">›</span>
        </button>
        <button type="button" onClick={() => navigate('/doctor/me/keywords')}>
          <span>
            <strong>키워드 및 알림</strong>
            <small>
              키워드 {settings.keywords.length}개 · 하루 최대 {settings.dailyNotificationLimit}건
            </small>
          </span>
          <span aria-hidden="true">›</span>
        </button>
        <button type="button" onClick={() => navigate('/doctor/me/telemedicine')}>
          <span>
            <strong>비대면 진료 설정</strong>
            <small>{settings.telemedicineEnabled ? '운영 중' : '운영하지 않음'}</small>
          </span>
          <span aria-hidden="true">›</span>
        </button>
      </section>

      <section className="demo-settings" aria-labelledby="doctor-demo-heading">
        <h2 id="doctor-demo-heading">계정</h2>
        <p>환자 화면으로 돌아갑니다. 시연용 계정 전환입니다.</p>
        <button type="button" className="secondary-cta" onClick={() => void toPatient()}>
          환자 화면으로
        </button>
      </section>

      <span className="visually-hidden" role="status">
        {notice}
      </span>
    </div>
  )
}

/** 병원 위치와 진료 시간은 의료기관에서 오고, 소개 글은 의사가 쓴다. */
export function DoctorProfileSettingsScreen() {
  const { doctor, clinic } = useCurrentDoctor()

  return (
    <div className="screen settings-screen">
      <SettingsHeader title="프로필 설정" />

      <section className="doctor-profile">
        <header className="profile-head">
          <DoctorPortrait doctor={doctor} size={72} />
          <div className="profile-identity">
            <h2>{doctor.name}</h2>
            <p className="doctor-clinic">{clinic?.name}</p>
            <span className="specialty-chip">{doctor.specialty}</span>
          </div>
        </header>

        <section aria-labelledby="setting-bio">
          <h3 id="setting-bio">자기소개</h3>
          <p>{doctor.bio || '아직 적지 않았습니다.'}</p>
        </section>

        <section aria-labelledby="setting-style">
          <h3 id="setting-style">진료 방법</h3>
          <p>{doctor.consultStyle || '아직 적지 않았습니다.'}</p>
        </section>

        <section aria-labelledby="setting-career">
          <h3 id="setting-career">약력</h3>
          <ul>
            {doctor.career.length > 0 ? (
              doctor.career.map((line) => <li key={line}>{line}</li>)
            ) : (
              <li>아직 적지 않았습니다.</li>
            )}
          </ul>
        </section>
      </section>

      {clinic && (
        <section className="clinic-panel" aria-labelledby="setting-clinic">
          <h2 id="setting-clinic">{clinic.name}</h2>
          <ClinicSchedule clinic={clinic} today={todayIso()} />
          <ClinicMap clinic={clinic} />
        </section>
      )}

      <p className="clinical-caveat">
        소개 글과 약력은 시연용 고정값입니다. 병원 위치와 진료 시간은 의료기관 정보에서 옵니다.
      </p>
    </div>
  )
}

/** 키워드는 의사가 직접 정한다. 노출 우선권을 사는 수단이 아니다. */
export function DoctorKeywordSettingsScreen() {
  const { doctor } = useCurrentDoctor()
  const { settingsOf, update } = useDoctorSettings()
  const settings = settingsOf(doctor.id, doctor.templateId)

  const [draft, setDraft] = useState(settings.keywords.join(', '))
  const [limit, setLimit] = useState(settings.dailyNotificationLimit)

  const save = (event: React.FormEvent) => {
    event.preventDefault()
    const keywords = draft
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
    update(doctor.id, { keywords, dailyNotificationLimit: limit }, '키워드와 알림을 저장했습니다.')
  }

  return (
    <div className="screen settings-screen">
      <SettingsHeader title="키워드 및 알림" />

      <form className="intake-form" onSubmit={save}>
        <label htmlFor="keyword-input">진료 보고 싶은 사례</label>
        <p className="field-hint">
          어떤 환자를 보고 싶은지 적어 주세요. 여기 적은 말이 들어간 사연이 사연 모음에 올라옵니다.
          쉼표나 줄바꿈으로 나눕니다.
        </p>
        <textarea
          id="keyword-input"
          rows={5}
          value={draft}
          placeholder="예) 만성 비염, 축농증, 오래가는 코막힘"
          onChange={(event) => setDraft(event.target.value)}
        />

        <div className="keyword-preview">
          {draft
            .split(/[,\n]/)
            .map((item) => item.trim())
            .filter(Boolean)
            .map((keyword) => (
              <span key={keyword} className="specialty-chip">
                {keyword}
              </span>
            ))}
        </div>

        <label htmlFor="limit-input">하루 알림 최대 건수</label>
        <p className="field-hint">
          이 수를 넘기면 알림을 보내지 않습니다. 남은 사연은 사연 모음에서 볼 수 있습니다.
        </p>
        <div className="pain-buttons" role="group" aria-label="하루 알림 최대 건수">
          {[3, 5, 10, 15, 20, 30].map((value) => (
            <button
              key={value}
              type="button"
              className={`pain-button ${limit === value ? 'is-active' : ''}`}
              aria-pressed={limit === value}
              onClick={() => setLimit(value)}
            >
              {value}
            </button>
          ))}
        </div>

        <button type="submit" className="primary-cta">
          저장
        </button>
      </form>

      <p className="clinical-caveat">
        키워드는 노출 우선권이 아닙니다. 매칭에만 쓰이고 정렬을 바꾸지 않습니다.
      </p>
    </div>
  )
}

const bands: SlotBand[] = ['dawn', 'morning', 'afternoon', 'night']

export function DoctorTelemedicineSettingsScreen() {
  const { doctor, clinic } = useCurrentDoctor()
  const { settingsOf, update } = useDoctorSettings()
  const settings = settingsOf(doctor.id, doctor.templateId)

  const toggleBand = (band: SlotBand) =>
    update(
      doctor.id,
      {
        telemedicineBands: settings.telemedicineBands.includes(band)
          ? settings.telemedicineBands.filter((item) => item !== band)
          : [...settings.telemedicineBands, band],
      },
      '비대면 시간대를 바꿨습니다.',
    )

  return (
    <div className="screen settings-screen">
      <SettingsHeader title="비대면 진료 설정" />

      <section className="my-menu" aria-label="비대면 운영">
        <label className="toggle-row">
          <span>
            <strong>비대면 진료 운영</strong>
            <small>끄면 환자 프로필에서 신청 버튼이 비활성으로 남습니다</small>
          </span>
          <input
            type="checkbox"
            checked={settings.telemedicineEnabled}
            onChange={(event) =>
              update(
                doctor.id,
                { telemedicineEnabled: event.target.checked },
                event.target.checked ? '비대면 진료를 켰습니다.' : '비대면 진료를 껐습니다.',
              )
            }
          />
        </label>

        <label className="toggle-row">
          <span>
            <strong>초진 비대면 받기</strong>
            <small>재진만 받으려면 꺼 두세요. 초진은 같은 지역만 가능합니다</small>
          </span>
          <input
            type="checkbox"
            checked={settings.acceptsFirstVisit}
            onChange={(event) =>
              update(doctor.id, { acceptsFirstVisit: event.target.checked }, '초진 설정을 바꿨습니다.')
            }
          />
        </label>
      </section>

      <h2 className="my-section-title">한 건에 잡는 시간</h2>
      <div className="option-chips">
        {[10, 15, 20, 30].map((minutes) => (
          <button
            key={minutes}
            type="button"
            className={`symptom-chip ${settings.slotMinutes === minutes ? 'is-active' : ''}`}
            aria-pressed={settings.slotMinutes === minutes}
            onClick={() => update(doctor.id, { slotMinutes: minutes }, '진료 시간을 바꿨습니다.')}
          >
            {minutes}분
          </button>
        ))}
      </div>

      <h2 className="my-section-title">비대면을 여는 시간대</h2>
      <div className="option-chips">
        {bands.map((band) => (
          <button
            key={band}
            type="button"
            className={`symptom-chip ${
              settings.telemedicineBands.includes(band) ? 'is-active' : ''
            }`}
            aria-pressed={settings.telemedicineBands.includes(band)}
            onClick={() => toggleBand(band)}
          >
            {bandLabels[band].label}
          </button>
        ))}
      </div>

      <h2 className="my-section-title">환자에게 보이는 안내</h2>
      <p className="note-preview">{settings.telemedicineNote || '아직 적지 않았습니다.'}</p>

      <p className="clinical-caveat">
        {clinic?.name}의 비대면 운영 여부와 월 비율 상한은 의료기관 설정에서 옵니다. 여기서 켜도
        의료기관이 운영하지 않으면 신청이 열리지 않습니다.
      </p>

      <button
        type="button"
        className="secondary-button"
        onClick={() => window.scrollTo({ top: 0 })}
      >
        <AppIcon name="calendar" /> 설정 확인 완료
      </button>
    </div>
  )
}
