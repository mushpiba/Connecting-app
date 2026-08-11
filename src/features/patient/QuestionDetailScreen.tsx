import { useState } from 'react'
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
  const { state, addNote, removeQuestion } = useCommunity()
  const navigate = useNavigate()
  const [noteBody, setNoteBody] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

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
  const notes = state.notes.filter((note) => note.questionId === question.id)

  const submitNote = (event: React.FormEvent) => {
    event.preventDefault()
    addNote(question.id, noteBody.trim())
    setNoteBody('')
  }

  return (
    <div className="screen">
      <button type="button" className="back-link" onClick={() => navigate('/stories')}>
        <span aria-hidden="true">‹</span> 사연
      </button>

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
        {notes.length > 0 && (
          <section className="note-list" aria-label="덧붙인 내용">
            {notes.map((note) => (
              <article key={note.id}>
                <span className="note-tag">덧붙임</span>
                <p>{note.body}</p>
                <time dateTime={note.createdAt}>{note.createdAt.slice(0, 10)}</time>
              </article>
            ))}
          </section>
        )}

        {question.priorVisit && (
          <p className="prior-visit-note">
            <span aria-hidden="true">▤</span> {question.priorVisit.visitedOn} ·{' '}
            {findClinic(question.priorVisit.clinicId)?.name ?? '기록된 의료기관'} 진료 이력을 밝혔습니다.
            해당 의료기관 의사에게만 보입니다.
          </p>
        )}
      </article>

      {/* 사연은 고칠 수 없다. 지나간 증상 설명이 조용히 바뀌면 그 위에 달린 답변이
          무엇을 보고 쓴 것인지 알 수 없어진다. 대신 덧붙이고, 아니면 지운다. */}
      {isAuthor && (
        <section className="author-tools" aria-labelledby="author-tools-heading">
          <h2 id="author-tools-heading">내 사연 관리</h2>
          <p className="field-hint">
            올린 사연은 고칠 수 없습니다. 빠뜨린 내용은 아래에 덧붙여 주세요.
          </p>

          <form className="note-form" onSubmit={submitNote}>
            <label htmlFor="note-body">덧붙일 내용</label>
            <textarea
              id="note-body"
              rows={3}
              value={noteBody}
              placeholder="예) 어제부터 열이 38도까지 올랐습니다."
              onChange={(event) => setNoteBody(event.target.value)}
            />
            <button type="submit" className="primary-cta" disabled={noteBody.trim().length < 2}>
              덧붙이기
            </button>
          </form>

          {confirmDelete ? (
            <div className="delete-confirm" role="alert">
              <p>
                사연을 지우면 달린 답변과 덧붙임도 함께 사라집니다. 되돌릴 수 없습니다.
              </p>
              <div className="step-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setConfirmDelete(false)}
                >
                  그대로 두기
                </button>
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => {
                    removeQuestion(question.id)
                    navigate('/stories')
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="text-link is-danger"
              onClick={() => setConfirmDelete(true)}
            >
              사연 삭제
            </button>
          )}
        </section>
      )}

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
