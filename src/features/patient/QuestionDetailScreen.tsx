import { useNavigate, useParams } from 'react-router-dom'
import { AnswerCard } from '../../components/AnswerCard'
import { IntakeSummary } from '../../components/IntakeSummary'
import { TriageSummary } from '../../components/TriageSummary'
import { demoToday } from '../../data/demoCalendar'
import { findClinic } from '../../data/demoClinics'
import { findDoctor } from '../../data/demoDoctors'
import { findPatient, findQuestion } from '../../data/demoQuestions'
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
  const author = findPatient(question.patientId)
  const isAuthor = question.patientId === state.patientId

  return (
    <div className="screen">
      <article className="question-detail">
        <div className="post-byline">
          <span className="post-avatar" aria-hidden="true">
            {(author?.displayName ?? '익명').replace(/^가상\s*/, '').slice(0, 2)}
          </span>
          <span className="post-author">{author?.displayName ?? '익명 환자'}</span>
          <time dateTime={question.createdAt}>
            {question.createdAt.slice(0, 10).replace(/-/g, '.')}
          </time>
          {question.triage.suggestions.map((suggestion) => (
            <span key={suggestion.specialty} className="specialty-chip">
              {suggestion.label}
            </span>
          ))}
        </div>

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

      {/* 진료과 안내는 글쓴이에게 필요한 정보다. 다른 사람이 읽는 글에서는
          작성자 줄의 진료과 칩으로 충분하고, 응급 안내도 글쓴이를 향한 문구다. */}
      {isAuthor && <TriageSummary triage={question.triage} />}

      <section className="answer-thread" aria-labelledby="answers-heading">
        <h2 id="answers-heading" className="thread-heading">
          의사 답변 {answers.length}
        </h2>
        {answers.length === 0 ? (
          <p className="empty-note">아직 답변이 없습니다. 의사가 답변하면 여기에 쌓입니다.</p>
        ) : (
          <div className="thread-list">
            {answers.map((answer) => {
              const doctor = findDoctor(answer.doctorId)
              if (!doctor) return null
              return (
                <AnswerCard
                  key={answer.id}
                  answer={answer}
                  doctor={doctor}
                  clinic={findClinic(doctor.clinicId)}
                />
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
