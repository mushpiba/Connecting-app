import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { IntakeSummary } from '../../components/IntakeSummary'
import { TriageSummary } from '../../components/TriageSummary'
import { demoNowIso, demoToday } from '../../data/demoCalendar'
import { findQuestion } from '../../data/demoQuestions'
import { symptomDurationDays } from '../../domain/intake'
import { canSeePriorVisit } from '../../domain/routing'
import { canDoctorAnswer } from '../../domain/visibility'
import { useCommunity } from '../../state/CommunityContext'
import { useDirectory } from '../../state/directory'

export function DoctorAnswerScreen() {
  const { questionId } = useParams()
  const { state, publishAnswer } = useCommunity()
  const navigate = useNavigate()
  const { doctors, findDoctor, findClinic } = useDirectory()
  const [body, setBody] = useState('')

  const doctor = findDoctor(state.doctorId) ?? doctors[0]
  const question = findQuestion(state.questions, questionId ?? '')

  if (!question || !canDoctorAnswer(doctor, question)) {
    return (
      <div className="screen">
        <p className="empty-note">
          {doctor.licenseVerified
            ? '이 계정에는 보이지 않는 질문입니다.'
            : '면허 검증을 마쳐야 답변할 수 있습니다.'}
        </p>
        <button type="button" className="secondary-button" onClick={() => navigate('/doctor/inbox')}>
          받은 질문으로
        </button>
      </div>
    )
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    publishAnswer({
      id: `a-local-${state.answers.length + 1}`,
      questionId: question.id,
      doctorId: doctor.id,
      body,
      createdAt: demoNowIso,
    })
    setBody('')
    navigate('/doctor/inbox')
  }

  return (
    <div className="screen">
      <article className="question-detail">
        <h1>{question.title}</h1>
        <p className="question-body">{question.body}</p>
        <IntakeSummary
          question={question}
          durationDays={symptomDurationDays(question.onsetDate, demoToday)}
        />
        {question.priorVisit && canSeePriorVisit(doctor, question) && (
          <p className="prior-visit-note">
            <span aria-hidden="true">▤</span> 환자가 밝힌 진료 이력 · {question.priorVisit.visitedOn}{' '}
            {findClinic(question.priorVisit.clinicId)?.name} · 차트로 확인이 필요합니다.
          </p>
        )}
      </article>

      <TriageSummary triage={question.triage} />

      <form className="intake-form" onSubmit={submit}>
        <label htmlFor="answer-body">답변</label>
        <textarea
          id="answer-body"
          rows={6}
          required
          minLength={5}
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
        <button type="submit" className="primary-cta">
          답변 등록
        </button>
        <p className="clinical-caveat">
          시연용 입력입니다. 서버로 전송되지 않으며 브라우저 메모리에만 저장됩니다.
        </p>
      </form>
    </div>
  )
}
