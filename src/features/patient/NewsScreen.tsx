import { useNavigate } from 'react-router-dom'
import { findDoctor } from '../../data/demoDoctors'
import { useCommunity } from '../../state/CommunityContext'
import { buildMyActivity } from './activity'

export function NewsScreen() {
  const { state } = useCommunity()
  const navigate = useNavigate()
  const activity = buildMyActivity(state.questions, state.answers, state.patientId)

  return (
    <div className="screen">
      <h1>내소식</h1>
      <p className="screen-lead">내가 쓴 사연과 새로 도착한 전문의 답변을 한곳에서 확인하세요.</p>

      {activity.length === 0 ? (
        <div className="empty-state">
          <h2>아직 도착한 소식이 없어요</h2>
          <p>증상을 사연으로 남기면 관련 진료과 의사의 답변이 여기에 쌓입니다.</p>
          <div className="empty-state-actions">
            <button type="button" className="primary-cta" onClick={() => navigate('/ask')}>
              증상 적어보기
            </button>
            <button type="button" className="secondary-button" onClick={() => navigate('/stories')}>
              사연 둘러보기
            </button>
          </div>
        </div>
      ) : (
        <div className="activity-feed">
          {activity.map((item) => (
            <button
              key={`${item.kind}-${item.id}`}
              type="button"
              className="activity-card"
              onClick={() => navigate(`/questions/${item.question.id}`)}
            >
              <span className={`activity-kind is-${item.kind}`}>
                {item.kind === 'answer' ? '새 답변' : '내 사연'}
              </span>
              {item.kind === 'answer' && (
                <strong>{findDoctor(item.answer.doctorId)?.name ?? '전문의'} 의사가 답변했어요</strong>
              )}
              <span>{item.question.title}</span>
              <time dateTime={item.occurredAt}>{item.occurredAt.slice(0, 10)}</time>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
