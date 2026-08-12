import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { demoWeekEndingOn } from '../../data/demoCalendar'
import { boardRuleSet } from '../../data/rules/boardRules'
import { empathyCount, rankWeeklyHot } from '../../domain/board'
import { applyReview, keywordFeed } from '../../domain/doctorFeed'
import { useCommunity } from '../../state/CommunityContext'
import { useDirectory } from '../../state/directory'
import { useDoctorSettings } from '../../state/DoctorSettingsContext'

type StoryTab = 'matched' | 'hot'

/**
 * 지목받은 것이 아니라 내가 볼 만해서 올라온 사연.
 *
 * HOT 은 여러 과를 돌았지만 답을 못 얻은 사례를 다른 과 의사에게도 보이게
 * 하려고 만든 자리다. 그래서 내 과가 아니어도 보인다.
 */
export function DoctorStoriesScreen() {
  const { state } = useCommunity()
  const { doctors, findDoctor } = useDirectory()
  const { settingsOf, reviewOf, setReview } = useDoctorSettings()
  const navigate = useNavigate()
  const [tab, setTab] = useState<StoryTab>('matched')

  const doctor = findDoctor(state.doctorId) ?? doctors[0]
  const settings = settingsOf(doctor.id, doctor.templateId)
  const feed = applyReview(keywordFeed(doctor, settings, state.questions), (questionId) =>
    reviewOf(doctor.id, questionId),
  )

  const ranks = rankWeeklyHot(state.questions, state.empathies, boardRuleSet, demoWeekEndingOn)
  const hot = state.questions
    .filter((question) => ranks.some((rank) => rank.questionId === question.id && rank.isHot))
    .sort(
      (left, right) =>
        right.createdAt.localeCompare(left.createdAt) || left.id.localeCompare(right.id),
    )

  return (
    <div className="screen">
      <h1>사연 모음</h1>
      <p className="screen-lead">
        내 진료과와 등록한 키워드로 걸린 사연입니다. 노출 순서는 과금이나 광고와 무관합니다.
      </p>

      <div className="segment-tabs" role="tablist" aria-label="사연 구분">
        {([
          ['matched', `내 과·키워드 ${feed.length}`],
          ['hot', `이번 주 HOT ${hot.length}`],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            className={tab === value ? 'is-active' : ''}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'matched' ? (
        feed.length === 0 ? (
          <div className="empty-state">
            <h2>걸린 사연이 없어요</h2>
            <p>키워드를 넓히면 더 많은 사연이 올라옵니다.</p>
            <div className="empty-state-actions">
              <button
                type="button"
                className="primary-cta"
                onClick={() => navigate('/doctor/me/keywords')}
              >
                키워드 설정
              </button>
            </div>
          </div>
        ) : (
          <div className="card-list">
            {feed.map((item) => {
              const review = reviewOf(doctor.id, item.question.id)
              const urgent = item.question.triage.redFlags.length > 0
              return (
              <article
                key={item.question.id}
                className={`question-card ${urgent ? 'is-urgent' : ''} ${
                  review === 'held' ? 'is-held' : ''
                }`}
              >
                {urgent && (
                  <span className="urgent-badge">
                    <span aria-hidden="true">!</span> 응급 신호
                  </span>
                )}
                <button
                  type="button"
                  className="question-open"
                  aria-label={`${item.question.title} 답변하기`}
                  onClick={() => navigate(`/doctor/questions/${item.question.id}`)}
                >
                  <strong>{item.question.title}</strong>
                  <span className="question-excerpt">{item.question.body}</span>
                </button>
                <div className="question-actions">
                  {item.reasons.includes('specialty') && (
                    <span className="specialty-chip">내 진료과</span>
                  )}
                  {item.matchedKeywords.map((keyword) => (
                    <span key={keyword} className="specialty-chip is-muted">
                      {keyword}
                    </span>
                  ))}
                </div>
                <div className="question-footer">
                  <span className="answer-count">
                    {review === 'held' ? '나중에 볼 것' : review === 'read' ? '읽음' : '새 사연'}
                  </span>
                  <span className="review-actions">
                    <button
                      type="button"
                      className="text-link"
                      onClick={() =>
                        setReview(doctor.id, item.question.id, review === 'read' ? 'new' : 'read')
                      }
                    >
                      {review === 'read' ? '안 읽음' : '읽음'}
                    </button>
                    <button
                      type="button"
                      className="text-link"
                      onClick={() =>
                        setReview(doctor.id, item.question.id, review === 'held' ? 'new' : 'held')
                      }
                    >
                      {review === 'held' ? '되돌리기' : '나중에'}
                    </button>
                  </span>
                </div>
              </article>
              )
            })}
          </div>
        )
      ) : (
        <div className="card-list">
          {hot.map((question) => (
            <article key={question.id} className="question-card is-hot">
              <span className="hot-badge">
                <span aria-hidden="true">✦</span> 공감 {empathyCount(state.empathies, question.id)}
              </span>
              <button
                type="button"
                className="question-open"
                aria-label={`${question.title} 답변하기`}
                onClick={() => navigate(`/doctor/questions/${question.id}`)}
              >
                <strong>{question.title}</strong>
                <span className="question-excerpt">{question.body}</span>
              </button>
              <div className="question-actions">
                {question.triage.suggestions.map((suggestion) => (
                  <span key={suggestion.specialty} className="specialty-chip">
                    {suggestion.label}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
