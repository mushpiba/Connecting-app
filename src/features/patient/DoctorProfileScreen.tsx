import { nowIso, todayIso } from '../../data/appClock'
import { useNavigate, useParams } from 'react-router-dom'
import { ClinicMap } from '../../components/ClinicMap'
import { ClinicSchedule } from '../../components/ClinicSchedule'
import { DoctorPortrait } from '../../components/DoctorPortrait'
import { eligibilityRuleSet } from '../../data/rules/eligibilityRules'
import { specialtyLabels } from '../../data/specialtyLabels'
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
    todayIso(),
  )
  /*
   * 살아 있는 신청만 버튼을 잠근다. 거절된 신청까지 세면 버튼이 「신청함」으로
   * 굳어 다시 낼 수 없고, 환자는 막힌 이유도 못 본다. 거절은 끝난 이야기다.
   */
  const savedEncounter = state.encounters.find(
    (item) =>
      item.doctorId === doctor.id &&
      item.questionId === question.id &&
      item.status !== 'declined',
  )
  const requested = savedEncounter !== undefined
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

        {/*
          필드를 늘리지 않고 줄인다. 제57조3항의 심의 예외 항목으로만 두면 이
          화면이 의료광고로 평가되더라도 심의 예외로 편입된다. 자기소개·진료
          방법·약력은 예외 목록 밖이라 지웠다 (C-3). 빈 자리로 두지 않고 섹션째
          없앤다 — 빈 칸은 「아직 안 썼다」로 읽혀 채우라는 압력이 된다.
        */}
        <dl className="profile-facts">
          <div>
            <dt>진료과목</dt>
            <dd>{specialtyLabels[doctor.specialty]}</dd>
          </div>
          <div>
            <dt>면허종류</dt>
            <dd>{doctor.licenseType}</dd>
          </div>
          <div>
            <dt>소재지</dt>
            <dd>{clinic.address}</dd>
          </div>
        </dl>
        <p className="clinical-caveat">
          의료기관 명칭·소재지·연락처·진료과목·의료인 성명과 면허종류만 표시합니다. 후기와 평점은
          두지 않습니다.
        </p>
      </article>

      <section className="clinic-panel" aria-labelledby="clinic-heading">
        <h2 id="clinic-heading">{clinic.name}</h2>
        <ClinicSchedule clinic={clinic} today={todayIso()} />
        <ClinicMap clinic={clinic} />
      </section>

      <section className="consult-actions" aria-labelledby="consult-heading">
        <h2 id="consult-heading">진료로 이어가기</h2>

        <button
          type="button"
          className="primary-cta"
          disabled={!gate.enabled || requested}
          aria-describedby={gate.enabled ? undefined : 'gate-reason'}
          onClick={() => void requestEncounter(question.id, doctor.id, clinic.id)}
        >
          {requested ? '비대면 진료 신청함' : '비대면 진료 신청'}
        </button>
        {!gate.enabled && (
          <p id="gate-reason" className="gate-reason">
            {gate.reason}
          </p>
        )}

        {/*
          신청하고 나면 갈 곳이 있어야 한다. 신청만 하고 화면이 그대로면 다음에
          무엇을 해야 하는지 알 수 없다. 의사가 먼저 열어야 붙으므로 그렇게 적는다.
        */}
        {savedEncounter && (
          <>
            <button
              type="button"
              className="secondary-button"
              onClick={() => navigate(`/visit/${savedEncounter.id}`)}
            >
              진료방 들어가기 <span aria-hidden="true">›</span>
            </button>
            <p className="field-hint">
              {doctor.name}에게 신청이 갔습니다. 의사가 진료방을 열면 연결됩니다.
            </p>
          </>
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
