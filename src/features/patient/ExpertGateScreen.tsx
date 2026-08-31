import { useNavigate } from 'react-router-dom'
import { DoctorPortrait } from '../../components/DoctorPortrait'
import { demoClinics } from '../../data/demoClinics'
import { demoDoctors } from '../../data/demoDoctors'
import { specialtyLabels } from '../../data/specialtyLabels'
import { isLiveMode } from '../../data/supabaseClient'
import { useCommunity } from '../../state/CommunityContext'
import { useSession } from '../../state/SessionContext'

export function ExpertGateScreen() {
  const navigate = useNavigate()
  const { switchRole, switchDoctor } = useCommunity()
  const { becomeDoctor } = useSession()

  /** 면허 검증을 마친 프로필만 고를 수 있다. 검증 전 계정은 목록에 없다. */
  const templates = demoDoctors.filter((doctor) => doctor.licenseVerified)

  const pick = async (doctorId: string) => {
    if (isLiveMode) {
      await becomeDoctor(doctorId)
    }
    switchDoctor(doctorId)
    switchRole('doctor')
    navigate('/doctor/home')
  }

  return (
    <div className="screen expert-gate-screen">
      <button type="button" className="back-link" onClick={() => navigate('/home')}>
        <span aria-hidden="true">‹</span> 홈으로
      </button>

      <h1>어느 의사로 들어갈까요</h1>
      <p className="screen-lead">
        고른 진료과로 분류된 사연이 받은 질문함에 들어옵니다. 다른 과로 분류된 사연은 보이지
        않습니다.
      </p>

      <div className="card-list">
        {templates.map((doctor) => {
          const clinic = demoClinics.find((item) => item.id === doctor.clinicId)
          return (
            <button
              key={doctor.id}
              type="button"
              className="expert-option"
              onClick={() => void pick(doctor.id)}
            >
              <DoctorPortrait doctor={doctor} size={52} />
              <span className="expert-option-body">
                <strong>
                  {doctor.name}
                  <span className="specialty-chip">{specialtyLabels[doctor.specialty]}</span>
                </strong>
                <span className="expert-option-clinic">{clinic?.name}</span>
              </span>
              <span className="row-chevron" aria-hidden="true">
                ›
              </span>
            </button>
          )
        })}
      </div>

      <p className="clinical-caveat">
        시연용 계정 전환입니다. 실제 서비스에서는 본인 확인과 의사 면허 검증을 거쳐야 하며 화면에서
        스스로 켤 수 없습니다. 이 데모의 환자와 사연은 전부 가상입니다.
      </p>
    </div>
  )
}
