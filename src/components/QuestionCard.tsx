import { AppIcon } from './AppIcon'
import { nowIso, todayIso } from '../data/appClock'
import { useNavigate } from 'react-router-dom'
import { symptomDurationDays } from '../domain/intake'
import type { PostVisibility, Question, SymptomCourse } from '../domain/types'

const visibilityLabels: Record<PostVisibility, string> = {
  public: '공개',
  'specialty-only': '관련 진료과만',
  'prior-clinic-only': '진료받은 의사만',
}

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
  showVisibility?: boolean
  onToggleEmpathy?: (questionId: string) => void
}

export function QuestionCard({
  question,
  answerCount,
  empathyCount,
  empathized,
  isHot,
  showVisibility = false,
  onToggleEmpathy,
}: QuestionCardProps) {
  const navigate = useNavigate()
  const days = symptomDurationDays(question.onsetDate, todayIso())

  return (
    <article className={`question-card ${isHot ? 'is-hot' : ''}`} data-testid="question-card">
      {isHot && (
        <span className="hot-badge">
          <AppIcon name="trend" inline /> 이번 주 많이 공감한 글
        </span>
      )}
      <button
        type="button"
        className="question-open"
        aria-label={`${question.title} 자세히 보기`}
        onClick={() => navigate(`/questions/${question.id}`)}
      >
        <strong>{question.title}</strong>
        <span className="question-excerpt">{question.body}</span>
      </button>
      <div className="question-actions">
        {showVisibility && (
          <span className="specialty-chip is-muted">{visibilityLabels[question.visibility]}</span>
        )}
        {question.triage.suggestions.map((suggestion) => (
          <span key={suggestion.specialty} className="specialty-chip">
            {suggestion.label}
          </span>
        ))}
        <span className="question-meta">
          증상 {days}일째 · {courseLabels[question.course]}
        </span>
      </div>
      <div className="question-footer">
        <span className="answer-count">
          <AppIcon name="answer" inline /> 답변 {answerCount}
        </span>
        {onToggleEmpathy && (
          <button
            type="button"
            className={`empathy-button ${empathized ? 'is-active' : ''}`}
            aria-pressed={empathized}
            aria-label={`${question.title} 공감`}
            onClick={() => onToggleEmpathy(question.id)}
          >
            <AppIcon name="empathy" inline /> 공감 {empathyCount}
          </button>
        )}
      </div>
    </article>
  )
}
