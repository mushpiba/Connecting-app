import { useNavigate } from 'react-router-dom'
import { useCommunity } from '../../state/CommunityContext'

export function ExpertGateScreen() {
  const { switchRole } = useCommunity()
  const navigate = useNavigate()

  const openDemo = () => {
    switchRole('doctor')
    navigate('/doctor/inbox')
  }

  return (
    <div className="screen expert-gate-screen">
      <button type="button" className="focus-back-button" onClick={() => navigate('/home')}>
        <span aria-hidden="true">‹</span> 홈으로
      </button>
      <section className="expert-gate-card">
        <span className="expert-mark" aria-hidden="true">Dr</span>
        <p className="eyebrow">MEDIVU EXPERT</p>
        <h1>의사 인증은 준비 중입니다</h1>
        <p>
          실제 전문가 전환에는 본인 확인과 의사 면허 검증이 필요합니다. 현재 버전에서는 인증된
          가상 의사 계정으로 답변 흐름만 둘러볼 수 있습니다.
        </p>
        <button type="button" className="primary-cta" onClick={openDemo}>
          데모 의사 화면 둘러보기
        </button>
        <p className="clinical-caveat">실제 인증이나 환자 정보 전송은 이루어지지 않습니다.</p>
      </section>
    </div>
  )
}
