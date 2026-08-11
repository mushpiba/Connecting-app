import { useState } from 'react'
import { QuestionCard } from '../../components/QuestionCard'
import { demoWeekEndingOn } from '../../data/demoCalendar'
import { boardRuleSet } from '../../data/rules/boardRules'
import { empathyCount, hasEmpathized, orderBoard, rankWeeklyHot } from '../../domain/board'
import { useCommunity } from '../../state/CommunityContext'

export type StoryFilter = 'all' | 'hot' | 'mine'

export function BoardScreen() {
  const { state, toggleQuestionEmpathy } = useCommunity()
  const [filter, setFilter] = useState<StoryFilter>('all')

  const ranks = rankWeeklyHot(state.questions, state.empathies, boardRuleSet, demoWeekEndingOn)
  const ordered = orderBoard(state.questions, ranks)

  /**
   * 내 사연은 공개 목록을 거치지 않는다. 비공개로 올린 글도 내 것이라
   * 여기서 못 보면 확인할 자리가 없다.
   */
  const mine = [...state.questions]
    .filter((question) => question.patientId === state.patientId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))

  const visible =
    filter === 'mine'
      ? mine
      : ordered.filter((question) =>
          filter === 'hot'
            ? ranks.some((rank) => rank.questionId === question.id && rank.isHot)
            : true,
        )

  return (
    <div className="screen">
      <h1>사연</h1>
      <p className="screen-lead">
        공개로 올린 질문이 모입니다. 한 주 동안 공감이 많이 모인 글은 위로 올라가 여러 과의 의사
        눈에 걸립니다.
      </p>

      <div className="segment-tabs" role="tablist" aria-label="사연 필터">
        {([
          ['all', '전체'],
          ['hot', 'HOT'],
          ['mine', '내 사연'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={filter === value}
            className={filter === value ? 'is-active' : ''}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="empty-state">
          <h2>{filter === 'mine' ? '아직 올린 사연이 없어요' : '해당하는 사연이 없어요'}</h2>
          <p>
            {filter === 'mine'
              ? '증상을 적어 올리면 여기에서 공개 범위와 함께 확인할 수 있습니다.'
              : '다른 탭에서 사연을 확인해 보세요.'}
          </p>
        </div>
      ) : (
      <div className="card-list">
        {visible.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            answerCount={state.answers.filter((a) => a.questionId === question.id).length}
            empathyCount={empathyCount(state.empathies, question.id)}
            empathized={hasEmpathized(state.empathies, question.id, state.patientId)}
            isHot={ranks.find((rank) => rank.questionId === question.id)?.isHot ?? false}
            showVisibility={filter === 'mine'}
            onToggleEmpathy={filter === 'mine' ? undefined : toggleQuestionEmpathy}
          />
        ))}
      </div>
      )}

      <p className="clinical-caveat">
        정렬 규칙 {boardRuleSet.name} · 기준일 {boardRuleSet.asOf} · 최근 {boardRuleSet.windowDays}일
        공감 {boardRuleSet.minWeeklyCount}개 이상, 최대 {boardRuleSet.hotLimit}개 고정
      </p>
    </div>
  )
}
