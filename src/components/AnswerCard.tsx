import { useNavigate } from 'react-router-dom'
import { DoctorPortrait } from './DoctorPortrait'
import type { Answer, Clinic, Doctor } from '../domain/types'

interface AnswerCardProps {
  answer: Answer
  doctor: Doctor
  clinic: Clinic | undefined
}

function formatDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, '.')
}

export function AnswerCard({ answer, doctor, clinic }: AnswerCardProps) {
  const navigate = useNavigate()
  const openProfile = () => navigate(`/doctors/${doctor.id}`)

  return (
    <article className="answer-card" data-testid={`answer-card-${doctor.id}`}>
      <button
        type="button"
        className="portrait-button"
        aria-label={`${doctor.name} 프로필 보기`}
        onClick={openProfile}
      >
        <DoctorPortrait doctor={doctor} size={52} />
      </button>

      <div className="answer-main">
        <div className="answer-byline">
          <button type="button" className="answer-name" onClick={openProfile}>
            {doctor.name}
          </button>
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
      </div>
    </article>
  )
}
