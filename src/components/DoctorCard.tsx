import { useNavigate } from 'react-router-dom'
import type { Clinic, Doctor } from '../domain/types'

interface DoctorCardProps {
  doctor: Doctor
  clinic: Clinic | undefined
}

export function DoctorCard({ doctor, clinic }: DoctorCardProps) {
  const navigate = useNavigate()

  return (
    <article className="doctor-card" data-testid={`doctor-card-${doctor.id}`}>
      <div className="doctor-identity">
        <strong>{doctor.name}</strong>
        <span className="doctor-clinic">{clinic?.name ?? '소속 미확인'}</span>
      </div>
      {clinic?.telemedicineEnabled && (
        <span className="telemedicine-badge">
          <span aria-hidden="true">◍</span> 비대면 가능
        </span>
      )}
      <button
        type="button"
        className="doctor-profile-link"
        aria-label={`${doctor.name} 프로필 보기`}
        onClick={() => navigate(`/doctors/${doctor.id}`)}
      >
        프로필 보기 <span aria-hidden="true">›</span>
      </button>
    </article>
  )
}
