import { nowIso, todayIso } from '../../data/appClock'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ExpressionFilterNotice } from '../../components/ExpressionFilterNotice'
import { IntakeSummary } from '../../components/IntakeSummary'
import { TriageSummary } from '../../components/TriageSummary'
import { answerLimitRuleSet } from '../../data/rules/answerLimitRules'
import { privateThreadRuleSet } from '../../data/rules/privateThreadRules'
import { templatesFor } from '../../data/rules/answerTemplates'
import { answerAllowance } from '../../domain/answerLimit'
import { buildEmrExport } from '../../domain/emrExport'
import { findQuestion } from '../../data/demoQuestions'
import { symptomDurationDays } from '../../domain/intake'
import { canSeePriorVisit } from '../../domain/routing'
import { canDoctorAnswer } from '../../domain/visibility'
import { findExpressionHits, threadForAnswer, toFilterHitRecords } from '../../domain/privateThread'
import type { ExpressionHit } from '../../domain/privateThread'
import { DoctorPrivateReply } from './DoctorPrivateReply'
import { useCommunity } from '../../state/CommunityContext'
import { useDirectory } from '../../state/directory'

export function DoctorAnswerScreen() {
  const { questionId } = useParams()
  const { state, publishAnswer, logExpressionHits } = useCommunity()
  const navigate = useNavigate()
  const { doctors, findDoctor, findClinic } = useDirectory()
  const [body, setBody] = useState('')
  const [hits, setHits] = useState<ExpressionHit[]>([])

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

  const allowance = answerAllowance(state.answers, doctor.id, todayIso(), answerLimitRuleSet)
  const notes = state.notes.filter((note) => note.questionId === question.id)
  const myAnswer =
    state.answers.find(
      (answer) => answer.questionId === question.id && answer.doctorId === doctor.id,
    ) ?? null
  const privateThread = myAnswer
    ? threadForAnswer(state.privateThreads, myAnswer.id, question.patientId)
    : null

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
    // 화면에서만 막으면 경로를 직접 열었을 때 뚫린다. 판정은 도메인에 있다.
    if (allowance.exhausted) return

    /*
      공개 답변에도 같은 규칙셋이 걸린다. PT-5(의료기관 유치)는 C-3이 「답변 본문
      안의 병원명 언급은 필터로 막고 로그를 보관한다」로 이미 요구한 것이고,
      처방·진단 단정·검사 지시가 공개 답변에서 허용될 이유도 없다. 다른 것은
      surface 하나뿐이라 걸린 기록이 어느 자리에서 나왔는지 구분된다.
    */
    const found = findExpressionHits(body.trim(), privateThreadRuleSet)
    if (found.length > 0) {
      setHits(found)
      logExpressionHits(
        toFilterHitRecords(
          found,
          doctor.id,
          'public-answer',
          { questionId: question.id },
          privateThreadRuleSet,
          nowIso(),
        ),
      )
      return
    }

    setHits([])
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
        {/* 쓰던 글은 지우지 않는다. 상한은 오늘 하루의 것이고 글은 내 것이다. */}
        <p className={`field-hint ${allowance.exhausted ? 'is-blocked' : ''}`}>
          {allowance.exhausted
            ? `${allowance.headline}. ${allowance.detail}`
            : `이 답변을 등록하면 오늘 남은 답변이 ${allowance.remaining - 1}회가 됩니다`}
        </p>
        <textarea
          id="answer-body"
          rows={6}
          required
          minLength={5}
          readOnly={allowance.exhausted}
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
        <p className="field-hint">
          처방·진단 단정·검사 지시로 읽히는 표현은 등록되지 않습니다. 걸리면 어디가 걸렸는지 알려
          드립니다.
        </p>
        <ExpressionFilterNotice hits={hits} />
        <button type="submit" className="primary-cta" disabled={allowance.exhausted}>
          답변 등록
        </button>
        <p className="clinical-caveat">
          시연용 입력입니다. 진단명과 처방을 담지 않습니다.
        </p>
      </form>

      {/*
        환자가 연 대화가 있을 때만 그린다. 없으면 「아직 대화가 없습니다」도 적지
        않는다 — 그 문장은 열 수 있다는 뜻으로 읽히고, 그러면 없는 문에 손잡이를
        그리는 것이 된다 (D-6 항목 1).
      */}
      {privateThread && <DoctorPrivateReply thread={privateThread} doctor={doctor} />}

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
