import { useNavigate } from 'react-router-dom'
import { visibilityLabels } from '../../components/QuestionCard'
import { useCommunity } from '../../state/CommunityContext'
import { useDirectory } from '../../state/directory'
import { buildMyActivity } from './activity'

/**
 * 내 소식 — 내 사연과 도착한 답변.
 *
 * 무료 커뮤니티에서 재방문의 이유는 하나다. 내 사연에 답이 달렸는가. 그래서
 * 헤더 종 아이콘이 아니라 탭이다(M1-0).
 *
 * **낱개로 늘어놓는다.** 홈은 사연 하나를 한 줄로 묶지만 여기는 묶지 않는다.
 * 홈에서 알고 싶은 것은 「몇 개 왔나」이고 여기서 알고 싶은 것은 「누가 뭐라고
 * 했나」다. 같은 데이터를 다른 굵기로 쓴다.
 */
export function NewsScreen() {
  const { state, loading, loadFailed, reload } = useCommunity()
  const navigate = useNavigate()
  const { findDoctor } = useDirectory()
  const activity = buildMyActivity(
    state.questions,
    state.answers,
    state.privateThreads,
    state.privateMessages,
    state.patientId,
  )

  return (
    <div className="screen">
      <h1>내소식</h1>
      <p className="screen-lead">내가 쓴 사연과 새로 도착한 전문의 답변을 한곳에서 확인하세요.</p>

      {/* C-2 파생 3. 읽지 않은 답변 수로 정렬하지 않는다. */}
      <p className="sort-note">최근에 일어난 일부터 보여 줍니다.</p>

      {loading ? (
        <div className="activity-feed" aria-busy="true" aria-label="소식을 불러오는 중">
          {[0, 1, 2].map((index) => (
            <div className="card-skeleton" key={index} aria-hidden="true">
              <span />
              <span />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* 이미 그린 목록은 지우지 않는다. */}
          {loadFailed && (
            <div className="section-error" role="alert">
              <p>소식을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.</p>
              <button type="button" className="secondary-button" onClick={reload}>
                다시 불러오기
              </button>
            </div>
          )}

          {activity.length === 0 ? (
            <div className="empty-state">
              <h2>아직 도착한 소식이 없어요</h2>
              <p>증상을 사연으로 남기면 관련 진료과 의사의 답변이 여기에 쌓입니다.</p>
              {/*
                아무것도 없는 화면에서 나가는 길이 하나뿐이면 그건 막다른 길이다.
                그래서 두 번째 버튼이 남의 사연을 읽는 자리로 간다.
              */}
              <div className="empty-state-actions">
                <button type="button" className="primary-cta" onClick={() => navigate('/ask')}>
                  증상 적어보기
                </button>
                <button type="button" className="secondary-button" onClick={() => navigate('/home')}>
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
                    {item.kind === 'answer'
                      ? '새 답변'
                      : item.kind === 'private-reply'
                        ? '비공개 회신'
                        : '내 사연'}
                  </span>
                  {item.kind === 'answer' && (
                    <strong>
                      {findDoctor(item.answer.doctorId)?.name ?? '전문의'} 의사가 답변했어요
                    </strong>
                  )}
                  {/*
                    본문도 미리보기도 싣지 않는다. 비공개 대화는 민감정보이고
                    여기는 목록 화면이다 — 본문은 사연 상세에 들어가야 보인다.
                    「방금」·「실시간」처럼 발행되지 않는 것을 발행되는 것처럼
                    적지도 않는다 (Q-7).
                  */}
                  {item.kind === 'private-reply' && (
                    <strong>
                      {findDoctor(item.doctorId)?.name ?? '전문의'} 의사가 비공개로 회신했어요
                    </strong>
                  )}
                  <span>{item.question.title}</span>
                  {/*
                    「내 사연」 탭이 하던 일을 여기가 이어받는다. 비공개로 올린 글의
                    공개 범위를 볼 자리가 앱에 이 한 곳뿐이다.
                  */}
                  {item.kind === 'question' && (
                    <span className="specialty-chip is-muted">
                      {visibilityLabels[item.question.visibility]}
                    </span>
                  )}
                  <time dateTime={item.occurredAt}>{item.occurredAt.slice(0, 10)}</time>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
