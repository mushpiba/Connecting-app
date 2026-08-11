import { useNavigate } from 'react-router-dom'
import { InstallCard } from '../../components/InstallCard'
import { isPrecheckComplete } from '../../domain/telemedicine'
import { useCommunity } from '../../state/CommunityContext'
import { buildMyActivity } from './activity'

export function HomeScreen() {
  const { state } = useCommunity()
  const navigate = useNavigate()

  const mine = state.questions.filter((question) => question.patientId === state.patientId)
  const mineIds = new Set(mine.map((question) => question.id))
  const answerCount = state.answers.filter((answer) => mineIds.has(answer.questionId)).length
  const precheckComplete = isPrecheckComplete(state.precheck)
  const latestActivity = buildMyActivity(state.questions, state.answers, state.patientId)[0]

  return (
    <div className="screen">
      <section className="hero" aria-labelledby="home-hero-heading">
        <p className="eyebrow">SYMPTOM TO CARE · DEMO</p>
        <h1 id="home-hero-heading">어디가 불편하신가요</h1>
        <p className="hero-lead">
          증상을 적어 주시면 어느 과로 가면 좋을지 정리해 드리고, 답변한 의사에게서 바로 진료로
          이어갈 수 있습니다.
        </p>
        <button type="button" className="primary-cta" onClick={() => navigate('/ask')}>
          증상 적어보기 <span aria-hidden="true">›</span>
        </button>
      </section>

      <section className="home-summary" aria-label="내 진료 준비와 소식">
        <button type="button" onClick={() => navigate('/me/precheck')}>
          <span className="summary-label">비대면 진료</span>
          <strong>{precheckComplete ? '사전 확인 완료' : '사전 확인 필요'}</strong>
          <span aria-hidden="true">›</span>
        </button>
        <button type="button" onClick={() => navigate('/news')}>
          <span className="summary-label">내소식</span>
          <strong>받은 답변 {answerCount}개</strong>
          <span aria-hidden="true">›</span>
        </button>
      </section>

      <section aria-labelledby="home-activity-heading">
        <h2 id="home-activity-heading">최근 내 활동</h2>
        {latestActivity ? (
          <button
            type="button"
            className="home-activity-card"
            onClick={() => navigate(`/questions/${latestActivity.question.id}`)}
          >
            <span>{latestActivity.kind === 'answer' ? '새 답변' : '내 사연'}</span>
            <strong>{latestActivity.question.title}</strong>
            <small>{latestActivity.occurredAt.slice(0, 10)}</small>
            <span aria-hidden="true">›</span>
          </button>
        ) : (
          <p className="empty-note">질문을 남기면 진행 상황을 여기에서 확인할 수 있습니다.</p>
        )}
      </section>

      <section aria-labelledby="home-quick-heading">
        <h2 id="home-quick-heading">빠른 메뉴</h2>
        <div className="home-quick-menu">
          <button type="button" aria-label="사전 확인" onClick={() => navigate('/me/precheck')}>
            <strong>사전 확인</strong>
            <span>비대면 진료 준비</span>
          </button>
          <button type="button" aria-label="예약 내역" onClick={() => navigate('/me/appointments')}>
            <strong>예약 내역</strong>
            <span>희망 시간 확인</span>
          </button>
          <button type="button" aria-label="내소식" onClick={() => navigate('/news')}>
            <strong>내소식</strong>
            <span>사연과 답변 확인</span>
          </button>
        </div>
      </section>

      <section className="care-prep-card" aria-labelledby="care-prep-heading">
        <p className="eyebrow">BEFORE YOUR VISIT</p>
        <h2 id="care-prep-heading">진료 준비</h2>
        <p>진료 전에 아래 세 가지를 메모해 두면 증상을 더 정확하게 설명할 수 있습니다.</p>
        <ul>
          <li>증상이 시작된 날과 달라진 과정</li>
          <li>현재 복용 중인 약 이름</li>
          <li>의사에게 꼭 묻고 싶은 내용</li>
        </ul>
      </section>

      <section className="stories-entry-card" aria-labelledby="stories-entry-heading">
        <div>
          <p className="eyebrow">COMMUNITY</p>
          <h2 id="stories-entry-heading">비슷한 고민이 궁금한가요?</h2>
          <p>공개 사연과 전문의 답변은 사연 탭에서 따로 확인할 수 있습니다.</p>
        </div>
        <button type="button" className="secondary-cta" onClick={() => navigate('/stories')}>
          사연 둘러보기
        </button>
      </section>

      <InstallCard />
    </div>
  )
}
