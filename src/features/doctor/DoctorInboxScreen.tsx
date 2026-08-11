import { useNavigate } from 'react-router-dom'
import { matchDoctors } from '../../domain/routing'
import { listVisibleQuestions } from '../../domain/visibility'
import { isLiveMode } from '../../data/supabaseClient'
import { useCommunity } from '../../state/CommunityContext'
import { useDirectory } from '../../state/directory'

export function DoctorInboxScreen() {
  const { state, switchDoctor } = useCommunity()
  const navigate = useNavigate()
  const { doctors, findDoctor, findClinic } = useDirectory()

  const doctor = findDoctor(state.doctorId) ?? doctors[0]
  const clinic = findClinic(doctor.clinicId)
  const visible = listVisibleQuestions(doctor, state.questions)

  return (
    <div className="screen">
      <h1>받은 질문</h1>

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
      <p className="screen-lead">{clinic?.name} · 공개 범위에 따라 보이는 글이 다릅니다.</p>

      {!doctor.licenseVerified && (
        <p className="gate-reason">
          면허 검증을 마쳐야 질문이 전달되고 답변을 쓸 수 있습니다. 검증 전에는 목록이 비어 있습니다.
        </p>
      )}

      {visible.length === 0 ? (
        <p className="empty-note">이 계정에 보이는 질문이 없습니다.</p>
      ) : (
        <div className="card-list">
          {visible.map((question) => {
            const match = matchDoctors(question, [doctor])[0]
            return (
              <article key={question.id} className="question-card">
                <button
                  type="button"
                  className="question-open"
                  aria-label={`${question.title} 답변하기`}
                  onClick={() => navigate(`/doctor/questions/${question.id}`)}
                >
                  <strong>{question.title}</strong>
                  <span className="question-meta">
                    {question.triage.suggestions.map((item) => item.label).join(' · ') ||
                      '진료과 미분류'}
                  </span>
                </button>
                <div className="question-actions">
                  {match?.reasons.includes('specialty') && (
                    <span className="specialty-chip">내 진료과</span>
                  )}
                  {match?.reasons.includes('keyword') && (
                    <span className="specialty-chip">등록 키워드 일치</span>
                  )}
                  {question.visibility !== 'public' && (
                    <span className="specialty-chip is-muted">비공개 글</span>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      <p className="clinical-caveat">
        노출 순서는 과금이나 광고와 무관합니다. 입력 순서를 그대로 둡니다.
      </p>
    </div>
  )
}
