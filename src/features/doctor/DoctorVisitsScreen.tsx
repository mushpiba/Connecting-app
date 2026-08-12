import { useNavigate } from 'react-router-dom'
import { demoToday } from '../../data/demoCalendar'
import { clinicScheduleOn, weekdayLabels } from '../../domain/clinicHours'
import { bandLabels } from '../../domain/documents'
import { directRequests } from '../../domain/doctorFeed'
import { documentLabel } from '../../domain/documents'
import { useCommunity } from '../../state/CommunityContext'
import { useDirectory } from '../../state/directory'
import { useDoctorSettings } from '../../state/DoctorSettingsContext'

export function DoctorVisitsScreen() {
  const { state } = useCommunity()
  const { doctors, findDoctor, findClinic, findPatient } = useDirectory()
  const { settingsOf } = useDoctorSettings()
  const navigate = useNavigate()

  const doctor = findDoctor(state.doctorId) ?? doctors[0]
  const clinic = findClinic(doctor.clinicId)
  const settings = settingsOf(doctor.id, doctor.templateId)
  const bookings = directRequests(doctor, state.questions, state.bookings).bookings
  const schedule = clinic ? clinicScheduleOn(clinic, demoToday) : null

  return (
    <div className="screen">
      <h1>진료</h1>

      <section className="prep-progress" aria-labelledby="visit-setting-heading">
        <div className="prep-progress-head">
          <h2 id="visit-setting-heading">비대면 진료</h2>
          <span>{settings.telemedicineEnabled ? '운영 중' : '운영하지 않음'}</span>
        </div>
        <ul className="prep-steps">
          <li className={settings.acceptsFirstVisit ? 'is-done' : ''}>
            <span aria-hidden="true">{settings.acceptsFirstVisit ? '✓' : '○'}</span> 초진 받기
          </li>
          <li className="is-done">
            <span aria-hidden="true">✓</span> 한 건 {settings.slotMinutes}분
          </li>
          {settings.telemedicineBands.map((band) => (
            <li key={band} className="is-done">
              <span aria-hidden="true">✓</span> {bandLabels[band].label}
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="secondary-button"
          onClick={() => navigate('/doctor/me/telemedicine')}
        >
          비대면 설정 열기
        </button>
      </section>

      <section aria-labelledby="visit-today-heading">
        <h2 id="visit-today-heading">오늘 진료</h2>
        <p className="screen-lead">
          {clinic?.name}
          {schedule &&
            (schedule.isOpenToday
              ? ` · ${schedule.today.open}–${schedule.today.close}`
              : ` · 오늘 휴진${
                  schedule.nextOpen ? ` · 다음 ${weekdayLabels[schedule.nextOpen.weekday]}요일` : ''
                }`)}
        </p>
      </section>

      <section aria-labelledby="visit-bookings-heading">
        <h2 id="visit-bookings-heading">받은 예약 요청 {bookings.length}</h2>
        {bookings.length === 0 ? (
          <div className="empty-state">
            <h2>전달된 희망 시간이 없어요</h2>
            <p>환자가 프로필에서 고른 희망 시간이 여기로 옵니다. 확정은 병원이 합니다.</p>
          </div>
        ) : (
          <div className="card-list">
            {bookings.map((booking) => (
              <article key={booking.id} className="appointment-card">
                <span className="status-chip">확정 전</span>
                <h3>
                  {booking.date} · {booking.time}
                </h3>
                <p>{findPatient(state.patientId)?.displayName ?? '환자'}가 전달한 희망 시간</p>
                <small>
                  {booking.documentTypes.length > 0
                    ? `서류 ${booking.documentTypes.map(documentLabel).join(', ')}`
                    : '요청한 서류 없음'}
                </small>
                <button
                  type="button"
                  className="primary-cta"
                  onClick={() => navigate(`/doctor/visit/${booking.id}`)}
                >
                  화상 진료방 열기
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="prep-progress" aria-labelledby="visit-room-heading">
        <div className="prep-progress-head">
          <h2 id="visit-room-heading">진료방 바로 열기</h2>
        </div>
        <p className="field-hint">
          예약 없이 시연할 때 씁니다. 같은 방 이름을 환자에게 알려주면 두 사람이 만납니다.
        </p>
        <button
          type="button"
          className="secondary-button"
          onClick={() => navigate(`/doctor/visit/demo-${doctor.id}`)}
        >
          demo-{doctor.id} 방 열기
        </button>
      </section>

      <p className="clinical-caveat">
        시연용 화면입니다. 예약 확정은 병원이 하며 이 화면에서 이루어지지 않습니다.
      </p>
    </div>
  )
}
