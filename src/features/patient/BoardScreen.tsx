import { useState } from 'react'
import { QuestionCard } from '../../components/QuestionCard'
import { demoWeekEndingOn } from '../../data/demoCalendar'
import { boardRuleSet } from '../../data/rules/boardRules'
import { triageRuleSet } from '../../data/rules/triageRules'
import { empathyCount, hasEmpathized, rankWeeklyHot } from '../../domain/board'
import { isPubliclyListed } from '../../domain/visibility'
import { useCommunity } from '../../state/CommunityContext'
import type { Question, Specialty } from '../../domain/types'

export type StoryFilter = 'all' | 'hot' | 'mine'

/** 최신순. 게시판에서 우리가 순서를 정하지 않는다. */
function newestFirst(questions: Question[]): Question[] {
  return [...questions].sort(
    (left, right) => right.createdAt.localeCompare(left.createdAt) || left.id.localeCompare(right.id),
  )
}

export function BoardScreen() {
  const { state, toggleQuestionEmpathy } = useCommunity()
  const [filter, setFilter] = useState<StoryFilter>('all')
  const [specialty, setSpecialty] = useState<Specialty | 'all'>('all')
  const [pickerOpen, setPickerOpen] = useState(false)

  const ranks = rankWeeklyHot(state.questions, state.empathies, boardRuleSet, demoWeekEndingOn)
  const isHot = (questionId: string) =>
    ranks.some((rank) => rank.questionId === questionId && rank.isHot)

  const mine = newestFirst(
    state.questions.filter((question) => question.patientId === state.patientId),
  )

  const base =
    filter === 'mine'
      ? mine
      : newestFirst(
          state.questions
            .filter(isPubliclyListed)
            .filter((question) => (filter === 'hot' ? isHot(question.id) : true)),
        )

  const visible =
    specialty === 'all'
      ? base
      : base.filter((question) =>
          question.triage.suggestions.some((item) => item.specialty === specialty),
        )

  const specialtyLabel =
    specialty === 'all'
      ? '전체 진료과'
      : (triageRuleSet.specialties.find((rule) => rule.specialty === specialty)?.label ?? '')

  return (
    <div className="screen">
      <h1>사연</h1>
      <p className="screen-lead">
        공개로 올린 질문이 최신순으로 모입니다. 진료과를 골라 그 과의 사연만 볼 수 있습니다.
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

      {/* 진료과 열 개를 늘 펼쳐 두면 목록보다 필터가 더 길어진다. 눌렀을 때만 편다. */}
      <div className="specialty-picker">
        <button
          type="button"
          className="specialty-toggle"
          aria-expanded={pickerOpen}
          onClick={() => setPickerOpen((open) => !open)}
        >
          <span>{specialtyLabel}</span>
          <span aria-hidden="true">{pickerOpen ? '⌃' : '⌄'}</span>
        </button>

        {pickerOpen && (
          <div className="specialty-options" role="group" aria-label="진료과 선택">
            <button
              type="button"
              className={`symptom-chip ${specialty === 'all' ? 'is-active' : ''}`}
              aria-pressed={specialty === 'all'}
              onClick={() => {
                setSpecialty('all')
                setPickerOpen(false)
              }}
            >
              전체
            </button>
            {triageRuleSet.specialties.map((rule) => (
              <button
                key={rule.specialty}
                type="button"
                className={`symptom-chip ${specialty === rule.specialty ? 'is-active' : ''}`}
                aria-pressed={specialty === rule.specialty}
                onClick={() => {
                  setSpecialty(rule.specialty)
                  setPickerOpen(false)
                }}
              >
                {rule.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="empty-state">
          <h2>
            {filter === 'mine' ? '아직 올린 사연이 없어요' : '해당하는 사연이 없어요'}
          </h2>
          <p>
            {filter === 'mine'
              ? '증상을 적어 올리면 여기에서 공개 범위와 함께 확인할 수 있습니다.'
              : '진료과를 바꾸거나 다른 탭에서 확인해 보세요.'}
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
              isHot={isHot(question.id)}
              showVisibility={filter === 'mine'}
              onToggleEmpathy={filter === 'mine' ? undefined : toggleQuestionEmpathy}
            />
          ))}
        </div>
      )}

      <p className="clinical-caveat">
        HOT 기준 {boardRuleSet.name} · 기준일 {boardRuleSet.asOf} · 최근 {boardRuleSet.windowDays}일
        공감 {boardRuleSet.minWeeklyCount}개 이상
      </p>
    </div>
  )
}
