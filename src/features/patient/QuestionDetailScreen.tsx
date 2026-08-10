import { useNavigate, useParams } from 'react-router-dom'
import { DoctorCard } from '../../components/DoctorCard'
import { IntakeSummary } from '../../components/IntakeSummary'
import { TriageSummary } from '../../components/TriageSummary'
import { demoToday } from '../../data/demoCalendar'
import { findClinic } from '../../data/demoClinics'
import { findDoctor } from '../../data/demoDoctors'
import { findQuestion } from '../../data/demoQuestions'
import { symptomDurationDays } from '../../domain/intake'
import { useCommunity } from '../../state/CommunityContext'

export function QuestionDetailScreen() {
  const { questionId } = useParams()
  const { state } = useCommunity()
  const navigate = useNavigate()

  const question = findQuestion(state.questions, questionId ?? '')
  if (!question) {
    return (
      <div className="screen">
        <p className="empty-note">질문을 찾지 못했습니다.</p>
        <button type="button" className="secondary-button" onClick={() => navigate('/board')}>
          게시판으로
        </button>
      </div>
    )
  }

  const answers = state.answers.filter((answer) => answer.questionId === question.id)
  const days = symptomDurationDays(question.onsetDate, demoToday)

  return (
    <div className="screen">
      <article className="question-detail">
        <h1>{question.title}</h1>
        <p className="question-body">{question.body}</p>
        <IntakeSummary question={question} durationDays={days} />
        {question.priorVisit && (
          <p className="prior-visit-note">
            <span aria-hidden="true">▤</span> {question.priorVisit.visitedOn} ·{' '}
            {findClinic(question.priorVisit.clinicId)?.name ?? '기록된 의료기관'} 진료 이력을 밝혔습니다.
            해당 의료기관 의사에게만 보입니다.
          </p>
        )}
      </article>

      <TriageSummary triage={question.triage} />

      <section aria-labelledby="answers-heading">
        <h2 id="answers-heading">의사 답변 {answers.length}</h2>
        {answers.length === 0 ? (
          <p className="empty-note">아직 답변이 없습니다.</p>
        ) : (
          <div className="card-list">
            {answers.map((answer) => {
              const doctor = findDoctor(answer.doctorId)
              if (!doctor) return null
              return (
                <section key={answer.id} className="answer-block">
                  <DoctorCard doctor={doctor} clinic={findClinic(doctor.clinicId)} />
                  <p className="answer-body">{answer.body}</p>
                </section>
              )
            })}
          </div>
        )}
        <p className="clinical-caveat">
          가상 의사가 쓴 시연용 답변입니다. 실제 의학적 조언이 아닙니다.
        </p>
      </section>
    </div>
  )
}
