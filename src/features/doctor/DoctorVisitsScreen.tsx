import { nowIso, todayIso } from '../../data/appClock'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clinicScheduleOn, weekdayLabels } from '../../domain/clinicHours'
import { bandLabels } from '../../domain/documents'
import { directRequests } from '../../domain/doctorFeed'
import { documentLabel } from '../../domain/documents'
import { doctorActions } from '../../domain/encounterTrack'
import type { EncounterAction } from '../../domain/encounterTrack'
import { useCommunity } from '../../state/CommunityContext'
import { useDirectory } from '../../state/directory'
import { useDoctorSettings } from '../../state/DoctorSettingsContext'
import type { EncounterRequest } from '../../domain/types'

/** `accepted`가 빠져 있었다. 확인해 놓고도 화면에는 「신청 도착」으로 남았다. */
const statusChips: Record<EncounterRequest['status'], string> = {
  requested: '신청 도착',
  accepted: '확인함',
  'in-progress': '진행 중',
  completed: '진료 마침',
  declined: '받지 못함',
}

export function DoctorVisitsScreen() {
  const { state, setEncounterStatus } = useCommunity()
  const { doctors, findDoctor, findClinic, findPatient } = useDirectory()
  const { settingsOf } = useDoctorSettings()
  const navigate = useNavigate()
  /** 거절은 되돌릴 수 없다. 누르면 바로 나가지 않고 한 번 되묻는다. */
  const [confirmDeclineId, setConfirmDeclineId] = useState<string | null>(null)

  const doctor = findDoctor(state.doctorId) ?? doctors[0]
  const clinic = findClinic(doctor.clinicId)
  const settings = settingsOf(doctor.id, doctor.templateId)
  const bookings = directRequests(doctor, state.questions, state.bookings).bookings

  /**
   * 상태를 먼저 바꾸고, 바뀐 뒤에만 진료방으로 넘어간다.
   *
   * 실패했는데 넘어가면 의사만 방에 있고 환자 화면에는 열렸다는 표시가 없다.
   */
  const run = async (encounterId: string, action: EncounterAction) => {
    const changed = await setEncounterStatus(encounterId, action.to)
    if (changed && action.to === 'in-progress') navigate(`/doctor/visit/${encounterId}`)
  }
  const schedule = clinic ? clinicScheduleOn(clinic, todayIso()) : null
  /* 나에게 온 신청만. 끝난 진료는 목록에서 뺀다. */
  const encounters = state.encounters.filter(
    (item) => item.doctorId === doctor.id && item.status !== 'completed' && item.status !== 'declined',
  )

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

      <section aria-labelledby="visit-encounters-heading">
        <h2 id="visit-encounters-heading">받은 비대면 진료 신청 {encounters.length}</h2>
        {encounters.length === 0 ? (
          <div className="empty-state">
            <h2>들어온 신청이 없어요</h2>
            <p>환자가 내 프로필에서 비대면 진료를 신청하면 여기로 옵니다.</p>
          </div>
        ) : (
          <div className="card-list">
            {encounters.map((encounter) => {
              const question = state.questions.find((item) => item.id === encounter.questionId)
              return (
                <article key={encounter.id} className="appointment-card">
                  <span className="status-chip">{statusChips[encounter.status]}</span>
                  <h3>{question?.title ?? '사연 없이 들어온 신청'}</h3>
                  <p>{findPatient(encounter.patientId)?.displayName ?? '환자'}가 신청했습니다.</p>
                  <small>{new Date(encounter.createdAt).toLocaleString('ko-KR')}</small>
                  {/*
                    갈 수 있는 곳은 `doctorActions`가 정한다. 화면이 상태를 직접
                    고르면 전이도에 없는 상태가 생긴다.
                  */}
                  {doctorActions(encounter).map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      className={action.id === 'open' ? 'primary-cta' : 'secondary-button'}
                      onClick={() =>
                        action.irreversible
                          ? setConfirmDeclineId(encounter.id)
                          : void run(encounter.id, action)
                      }
                    >
                      {action.label}
                    </button>
                  ))}
                  {confirmDeclineId === encounter.id && (
                    <div className="delete-confirm" role="alert">
                      <p>
                        거절하면 되돌릴 수 없습니다. 환자에게는 대면 진료를 예약하거나 다른 의사에게
                        물어보는 길을 안내합니다.
                      </p>
                      <div className="step-actions">
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => setConfirmDeclineId(null)}
                        >
                          그대로 두기
                        </button>
                        <button
                          type="button"
                          className="danger-button"
                          onClick={() => {
                            setConfirmDeclineId(null)
                            void setEncounterStatus(encounter.id, 'declined')
                          }}
                        >
                          거절하기
                        </button>
                      </div>
                    </div>
                  )}
                  {question && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => navigate(`/doctor/questions/${question.id}`)}
                    >
                      사연 먼저 읽기 <span aria-hidden="true">›</span>
                    </button>
                  )}
                </article>
              )
            })}
          </div>
        )}
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
