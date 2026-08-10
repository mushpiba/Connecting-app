import { useNavigate } from 'react-router-dom'
import type { Answer, Clinic, Doctor } from '../domain/types'

interface AnswerCardProps {
  answer: Answer
  doctor: Doctor
  clinic: Clinic | undefined
}

function formatDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, '.')
}

/** 이름 끝 두 글자. 가상 이름이라 성만 떼면 구분이 안 된다. */
function initials(name: string): string {
  return name.replace(/^가상\s*/, '').slice(0, 2)
}

export function AnswerCard({ answer, doctor, clinic }: AnswerCardProps) {
  const navigate = useNavigate()

  return (
    <article className="answer-card" data-testid={`answer-card-${doctor.id}`}>
      <span className="answer-avatar" aria-hidden="true">
        {initials(doctor.name)}
      </span>

      <div className="answer-main">
        <div className="answer-byline">
          <strong>{doctor.name}</strong>
          <span className="answer-clinic">{clinic?.name ?? '소속 미확인'}</span>
          {clinic?.telemedicineEnabled && (
            <span className="telemedicine-badge">
              <span aria-hidden="true">◍</span> 비대면 가능
            </span>
          )}
          <time className="answer-date" dateTime={answer.createdAt}>
            {formatDate(answer.createdAt)}
          </time>
        </div>

        <p className="answer-body">{answer.body}</p>

        <button
          type="button"
          className="answer-profile-link"
          aria-label={`${doctor.name} 프로필 보기`}
          onClick={() => navigate(`/doctors/${doctor.id}`)}
        >
          프로필 보고 진료 문의 <span aria-hidden="true">›</span>
        </button>
      </div>
    </article>
  )
}
