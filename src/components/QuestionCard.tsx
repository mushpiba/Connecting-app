import { useNavigate } from 'react-router-dom'
import { demoToday } from '../data/demoCalendar'
import { symptomDurationDays } from '../domain/intake'
import type { Question, SymptomCourse } from '../domain/types'

const courseLabels: Record<SymptomCourse, string> = {
  worsening: '점점 심해짐',
  unchanged: '그대로',
  fluctuating: '좋았다 나빴다',
  improving: '좋아지는 중',
}

interface QuestionCardProps {
  question: Question
  answerCount: number
  empathyCount: number
  empathized: boolean
  isHot: boolean
  onToggleEmpathy?: (questionId: string) => void
}

export function QuestionCard({
  question,
  answerCount,
  empathyCount,
  empathized,
  isHot,
  onToggleEmpathy,
}: QuestionCardProps) {
  const navigate = useNavigate()
  const days = symptomDurationDays(question.onsetDate, demoToday)

  return (
    <article className={`question-card ${isHot ? 'is-hot' : ''}`} data-testid="question-card">
      {isHot && (
        <span className="hot-badge">
          <span aria-hidden="true">✦</span> 이번 주 많이 공감한 글
        </span>
      )}
      <button
        type="button"
        className="question-open"
        aria-label={`${question.title} 자세히 보기`}
        onClick={() => navigate(`/questions/${question.id}`)}
      >
        <strong>{question.title}</strong>
        <span className="question-meta">
          증상 {days}일째 · {courseLabels[question.course]} · 답변 {answerCount}
        </span>
      </button>
      <div className="question-actions">
        {question.triage.suggestions.map((suggestion) => (
          <span key={suggestion.specialty} className="specialty-chip">
            {suggestion.label}
          </span>
        ))}
        {onToggleEmpathy && (
          <button
            type="button"
            className={`empathy-button ${empathized ? 'is-active' : ''}`}
            aria-pressed={empathized}
            aria-label={`${question.title} 공감`}
            onClick={() => onToggleEmpathy(question.id)}
          >
            <span aria-hidden="true">♥</span> 공감 {empathyCount}
          </button>
        )}
      </div>
    </article>
  )
}
