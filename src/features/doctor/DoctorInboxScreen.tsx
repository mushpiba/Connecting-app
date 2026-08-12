import { nowIso, todayIso } from '../../data/appClock'
import { useNavigate } from 'react-router-dom'
import { isLiveMode } from '../../data/supabaseClient'
import { directRequests } from '../../domain/doctorFeed'
import { documentLabel } from '../../domain/documents'
import { symptomDurationDays } from '../../domain/intake'
import { useCommunity } from '../../state/CommunityContext'
import { useDirectory } from '../../state/directory'

/**
 * 나를 지목해서 온 것만 모은다.
 *
 * 환자가 우리 의료기관에서 진료받았다고 밝힌 사연과 나에게 온 예약 요청이다.
 * 답을 기다리는 사람이 정해져 있어 사연 모음과 성격이 다르다.
 */
export function DoctorInboxScreen() {
  const { state, switchDoctor } = useCommunity()
  const navigate = useNavigate()
  const { doctors, findDoctor, findClinic } = useDirectory()

  const doctor = findDoctor(state.doctorId) ?? doctors[0]
  const clinic = findClinic(doctor.clinicId)
  const direct = directRequests(doctor, state.questions, state.bookings)

  return (
    <div className="screen">
      <h1>직접 받은 질문</h1>

      {!isLiveMode && (
        <>
          <label htmlFor="doctor-select">지금 보고 있는 계정</label>
          <select
            id="doctor-select"
            value={doctor.id}
            onChange={(event) => switchDoctor(event.target.value)}
          >
            {doctors.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {findClinic(item.clinicId)?.name}
              </option>
            ))}
          </select>
        </>
      )}

      <p className="screen-lead">
        {clinic?.name}에서 진료받았다고 밝힌 환자가 남긴 사연과, 나에게 온 예약 요청입니다.
      </p>

      {!doctor.licenseVerified && (
        <p className="gate-reason">면허 검증을 마쳐야 질문이 전달되고 답변을 쓸 수 있습니다.</p>
      )}

      <h2>지목한 사연 {direct.questions.length}</h2>
      {direct.questions.length === 0 ? (
        <div className="empty-state">
          <h2>아직 지목한 사연이 없어요</h2>
          <p>진료받았던 의사에게만 공개한 사연이 여기로 옵니다.</p>
          <div className="empty-state-actions">
            <button
              type="button"
              className="primary-cta"
              onClick={() => navigate('/doctor/stories')}
            >
              사연 모음 보기
            </button>
          </div>
        </div>
      ) : (
        <div className="card-list">
          {direct.questions.map((question) => (
            <article key={question.id} className="question-card">
              <button
                type="button"
                className="question-open"
                aria-label={`${question.title} 답변하기`}
                onClick={() => navigate(`/doctor/questions/${question.id}`)}
              >
                <strong>{question.title}</strong>
                <span className="question-excerpt">{question.body}</span>
              </button>
              <div className="question-actions">
                <span className="specialty-chip">우리 의료기관 진료 이력</span>
                <span className="question-meta">
                  증상 {symptomDurationDays(question.onsetDate, todayIso())}일째
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      <h2>받은 예약 요청 {direct.bookings.length}</h2>
      {direct.bookings.length === 0 ? (
        <p className="empty-note">전달된 희망 시간이 없습니다.</p>
      ) : (
        <div className="list-card">
          {direct.bookings.map((booking) => (
            <div key={booking.id} className="list-row">
              <span className="row-tag is-question">예약 요청</span>
              <span className="row-title">
                {booking.date} {booking.time}
              </span>
              <span className="row-note">
                {booking.documentTypes.length > 0
                  ? booking.documentTypes.map(documentLabel).join(', ')
                  : '서류 없음'}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="clinical-caveat">
        노출 순서는 과금이나 광고와 무관합니다. 입력 순서를 그대로 둡니다.
      </p>
    </div>
  )
}
