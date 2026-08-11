import { useNavigate, useParams } from 'react-router-dom'
import { ClinicMap } from '../../components/ClinicMap'
import { ClinicSchedule } from '../../components/ClinicSchedule'
import { DoctorPortrait } from '../../components/DoctorPortrait'
import { demoToday } from '../../data/demoCalendar'
import { eligibilityRuleSet } from '../../data/rules/eligibilityRules'
import { buildReferralNotice } from '../../domain/notice'
import { evaluateTelemedicineGate } from '../../domain/telemedicine'
import { useCommunity } from '../../state/CommunityContext'
import { useDirectory } from '../../state/directory'

export function DoctorProfileScreen() {
  const { doctorId } = useParams()
  const { state, requestEncounter } = useCommunity()
  const navigate = useNavigate()
  const { findDoctor, findClinic } = useDirectory()

  const doctor = findDoctor(doctorId ?? '')
  const clinic = doctor ? findClinic(doctor.clinicId) : undefined

  if (!doctor || !clinic) {
    return (
      <div className="screen">
        <p className="empty-note">의사 정보를 찾지 못했습니다.</p>
        <button type="button" className="secondary-button" onClick={() => navigate('/board')}>
          게시판으로
        </button>
      </div>
    )
  }

  const answered = state.answers.filter((answer) => answer.doctorId === doctor.id)
  const question =
    state.questions.find((item) => item.id === answered[0]?.questionId) ?? state.questions[0]

  const gate = evaluateTelemedicineGate(
    state.precheck,
    question,
    clinic,
    eligibilityRuleSet,
    demoToday,
  )
  const requested = state.requestedEncounterIds.includes(`${question.id}:${doctor.id}`)
  const notice = gate.result && !gate.enabled ? buildReferralNotice(gate.result, clinic) : null

  return (
    <div className="screen">
      <article className="doctor-profile">
        <header className="profile-head">
          <DoctorPortrait doctor={doctor} size={96} />
          <div className="profile-identity">
            <h1>{doctor.name}</h1>
            <p className="doctor-clinic">
              {clinic.name} · {clinic.region}
            </p>
            {clinic.telemedicineEnabled && (
              <span className="telemedicine-badge">
                <span aria-hidden="true">◍</span> 비대면 가능
              </span>
            )}
          </div>
        </header>

        <section aria-labelledby="doctor-bio-heading">
          <h2 id="doctor-bio-heading">자기소개</h2>
          <p>{doctor.bio}</p>
        </section>

        <section aria-labelledby="doctor-style-heading">
          <h2 id="doctor-style-heading">진료 방법</h2>
          <p>{doctor.consultStyle}</p>
        </section>

        <section aria-labelledby="doctor-career-heading">
          <h2 id="doctor-career-heading">약력</h2>
          <ul>
            {doctor.career.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      </article>

      <section className="clinic-panel" aria-labelledby="clinic-heading">
        <h2 id="clinic-heading">{clinic.name}</h2>
        <ClinicSchedule clinic={clinic} today={demoToday} />
        <ClinicMap clinic={clinic} />
      </section>

      <section className="consult-actions" aria-labelledby="consult-heading">
        <h2 id="consult-heading">진료로 이어가기</h2>

        <button
          type="button"
          className="primary-cta"
          disabled={!gate.enabled || requested}
          aria-describedby={gate.enabled ? undefined : 'gate-reason'}
          onClick={() => requestEncounter(question.id, doctor.id)}
        >
          {requested ? '비대면 진료 신청함' : '비대면 진료 신청'}
        </button>
        {!gate.enabled && (
          <p id="gate-reason" className="gate-reason">
            {gate.reason}
          </p>
        )}

        <button
          type="button"
          className="secondary-button"
          onClick={() => navigate(`/booking/${doctor.id}`)}
        >
          초진 대면 진료 예약 <span aria-hidden="true">›</span>
        </button>
        <p className="field-hint">
          희망 시간을 골라 {clinic.name}에 전달합니다. 확정은 병원이 합니다.
        </p>

        {notice && (
          <div className="referral-notice">
            <h3>대면 진료 안내</h3>
            <p className="referral-body">{notice.patientMessage}</p>
          </div>
        )}

        <p className="clinical-caveat">
          행정적 예비 확인입니다. 최종 판단은 의료진이 하며 실제 예약이나 진료로 이어지지 않습니다.
        </p>
      </section>
    </div>
  )
}
