import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { InstallCard } from '../../components/InstallCard'
import { QuestionCard } from '../../components/QuestionCard'
import { todayIso } from '../../data/appClock'
import { demoWeekEndingOn } from '../../data/demoCalendar'
import { boardRuleSet } from '../../data/rules/boardRules'
import { triageRuleSet } from '../../data/rules/triageRules'
import { empathyCount, hasEmpathized, rankWeeklyHot } from '../../domain/board'
import { activeEncounter, encounterTrack } from '../../domain/encounterTrack'
import { isPubliclyListed } from '../../domain/visibility'
import { useCommunity } from '../../state/CommunityContext'
import { useDirectory } from '../../state/directory'
import { progressStrip, resolveNextStep } from './nextStep'
import type { Question, Specialty } from '../../domain/types'

type StoryFilter = 'all' | 'hot'

/** 최신순. 게시판에서 우리가 순서를 정하지 않는다. */
function newestFirst(questions: Question[]): Question[] {
  return [...questions].sort(
    (left, right) => right.createdAt.localeCompare(left.createdAt) || left.id.localeCompare(right.id),
  )
}

/**
 * 홈 = 사연 피드 + 진행 상태 스트립.
 *
 * D-5가 홈과 사연을 뒤집었다. 볼 의사를 모르는 사람은 남의 사연에서 자기 증상을
 * 발견해야 쓸 마음이 생기고, 그게 이 앱의 축(D-1)이기 때문이다.
 *
 * **홈을 상태에 따라 바꾸지 않는다.** 갈 곳을 아는 사람에게 늘어난 한 단계는
 * 피드 위의 얇은 줄 하나로 갚는다 — 진행 중인 건이 없으면 자리도 차지하지 않는다.
 *
 * 「내 사연」 탭을 여기 두지 않는다. 그건 `/news`와 같은 것을 가리킨다. 홈은 남의
 * 사연을 읽는 자리, 내 소식은 내 것을 보는 자리로 가른다.
 */
export function HomeScreen() {
  const { state, toggleQuestionEmpathy, loading, loadFailed, reload } = useCommunity()
  const navigate = useNavigate()
  const { findDoctor } = useDirectory()
  const [filter, setFilter] = useState<StoryFilter>('all')
  const [specialty, setSpecialty] = useState<Specialty | 'all'>('all')
  const [pickerOpen, setPickerOpen] = useState(false)

  const step = resolveNextStep(
    state.questions,
    state.answers,
    state.bookings,
    state.patientId,
    todayIso(),
  )
  const pending = activeEncounter(state.encounters, state.patientId)
  const track = pending
    ? encounterTrack(pending, findDoctor(pending.doctorId)?.name ?? '의사')
    : null
  // 잘못된 스트립을 먼저 그리면 안 된다. 불러오는 중에는 자리를 비워 둔다.
  const strip = loading ? null : progressStrip(step, track, todayIso())

  const ranks = rankWeeklyHot(state.questions, state.empathies, boardRuleSet, demoWeekEndingOn)
  const isHot = (questionId: string) =>
    ranks.some((rank) => rank.questionId === questionId && rank.isHot)

  const listed = state.questions.filter(isPubliclyListed)
  const base = newestFirst(listed.filter((question) => (filter === 'hot' ? isHot(question.id) : true)))
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

  const showAll = () => {
    setFilter('all')
    setSpecialty('all')
  }

  return (
    <div className="screen">
      <h1>사연</h1>

      {strip && (
        <button
          type="button"
          className={`progress-strip is-${strip.kind}`}
          onClick={() => navigate(strip.path)}
        >
          <span>{strip.label}</span>
          <span aria-hidden="true">›</span>
        </button>
      )}

      <p className="screen-lead">
        공개로 올린 사연이 최신순으로 모입니다. 진료과를 골라 그 과의 사연만 볼 수 있습니다.
      </p>

      <div className="segment-tabs" role="tablist" aria-label="사연 필터">
        {([
          ['all', '전체'],
          ['hot', 'HOT'],
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

      {filter === 'hot' && (
        <p className="tip-line">
          이번 주 공감이 많이 모인 사연입니다. 이 탭 안에서도 최신순으로 늘어놓습니다.
        </p>
      )}

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

      {/* C-2 파생 3. 돈을 안 받아도 정렬이 선택을 유도하면 걸린다. */}
      <p className="sort-note">
        사연은 올라온 순서대로만 보입니다. 어느 사연을 위에 올릴지 MediVU가 정하지 않습니다.
      </p>

      {loading ? (
        <div className="card-list" aria-busy="true" aria-label="사연을 불러오는 중">
          {[0, 1, 2].map((index) => (
            <div className="card-skeleton" key={index} aria-hidden="true">
              <span />
              <span />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* 새로고침 실패로 읽던 목록이 사라지면 사용자는 자기가 뭘 잘못했다고 생각한다. */}
          {loadFailed && (
            <div className="section-error" role="alert">
              <p>사연을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.</p>
              <button type="button" className="secondary-button" onClick={reload}>
                다시 불러오기
              </button>
            </div>
          )}

          {visible.length === 0 ? (
            <div className="empty-state">
              {listed.length === 0 ? (
                <>
                  <h2>아직 올라온 사연이 없어요</h2>
                  <p>
                    첫 사연이 되어 주세요. 증상을 적으면 관련 진료과 의사에게 전달됩니다.
                  </p>
                  <div className="empty-state-actions">
                    <button type="button" className="primary-cta" onClick={() => navigate('/ask')}>
                      증상 적어보기
                    </button>
                  </div>
                </>
              ) : specialty !== 'all' ? (
                <>
                  <h2>이 진료과에는 아직 사연이 없어요</h2>
                  <p>전체로 돌아가면 다른 과의 사연을 볼 수 있습니다.</p>
                  <div className="empty-state-actions">
                    <button type="button" className="secondary-button" onClick={showAll}>
                      전체 보기
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2>이번 주에 공감이 모인 사연이 아직 없어요</h2>
                  <p>전체 탭에서 올라온 사연을 볼 수 있습니다.</p>
                  <div className="empty-state-actions">
                    <button type="button" className="secondary-button" onClick={showAll}>
                      전체 보기
                    </button>
                  </div>
                </>
              )}
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
                  // 자기 사연에는 공감이 뜨지 않는다. 자기 글에 공감을 누르는 자리를
                  // 만들면 그 수가 무엇을 뜻하는지 알 수 없어진다.
                  onToggleEmpathy={
                    question.patientId === state.patientId ? undefined : toggleQuestionEmpathy
                  }
                />
              ))}
            </div>
          )}
        </>
      )}

      <p className="clinical-caveat">
        HOT 기준 {boardRuleSet.name} · 기준일 {boardRuleSet.asOf} · 최근 {boardRuleSet.windowDays}일
        공감 {boardRuleSet.minWeeklyCount}개 이상
      </p>

      <InstallCard />
    </div>
  )
}
