import { nowIso, todayIso } from '../../data/appClock'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { IntakeSummary } from '../../components/IntakeSummary'
import { TriageSummary } from '../../components/TriageSummary'
import { templatesFor } from '../../data/rules/answerTemplates'
import { buildEmrExport } from '../../domain/emrExport'
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

  const notes = state.notes.filter((note) => note.questionId === question.id)
  const myAnswer =
    state.answers.find(
      (answer) => answer.questionId === question.id && answer.doctorId === doctor.id,
    ) ?? null

  /** 진단명과 처방은 담지 않는다. EMR 안에서 의사가 정한다. */
  const exportToEmr = () => {
    const payload = buildEmrExport(
      question,
      notes,
      myAnswer ?? (body.trim() ? { id: 'draft', questionId: question.id, doctorId: doctor.id, body, createdAt: nowIso() } : null),
      doctor,
      findClinic(doctor.clinicId),
      todayIso(),
      nowIso(),
    )
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `medivu-emr-${question.id}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    publishAnswer({
      id: `a-local-${state.answers.length + 1}`,
      questionId: question.id,
      doctorId: doctor.id,
      body,
      createdAt: nowIso(),
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
          durationDays={symptomDurationDays(question.onsetDate, todayIso())}
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
        <div className="template-row" role="group" aria-label="자주 쓰는 문구">
          {templatesFor(doctor.specialty).map((template) => (
            <button
              key={template.id}
              type="button"
              className="symptom-chip"
              onClick={() => setBody((prev) => (prev ? `${prev}

${template.body}` : template.body))}
            >
              {template.label}
            </button>
          ))}
        </div>
        <p className="field-hint">
          문구를 넣은 뒤 환자에 맞게 고쳐 주세요. 그대로 보내라고 만든 것이 아닙니다.
        </p>
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
          시연용 입력입니다. 진단명과 처방을 담지 않습니다.
        </p>
      </form>

      <section className="emr-export" aria-labelledby="emr-export-heading">
        <h2 id="emr-export-heading">EMR로 넘기기</h2>
        <p>
          환자가 한 말과 거기서 뽑은 키워드, 그리고 지금 쓴 문장을 EMR이 받을 수 있는 모양으로
          내려받습니다. 무엇을 진단하고 무엇을 처방할지는 EMR 안에서 정합니다.
        </p>
        <button type="button" className="secondary-button" onClick={exportToEmr}>
          진료 기록 내보내기
        </button>
        <p className="clinical-caveat">
          가상 데이터입니다. 실제 EMR로 전송되지 않고 파일로만 저장됩니다.
        </p>
      </section>
    </div>
  )
}
