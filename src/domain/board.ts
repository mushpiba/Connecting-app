import { isPubliclyListed } from './visibility'
import type { BoardRuleSet, Empathy, Question, WeeklyRank } from './types'

function dayStart(date: string): number {
  return Date.parse(`${date}T00:00:00.000Z`)
}

export function empathyCount(empathies: Empathy[], questionId: string): number {
  return empathies.filter((item) => item.questionId === questionId).length
}

export function hasEmpathized(
  empathies: Empathy[],
  questionId: string,
  patientId: string,
): boolean {
  return empathies.some(
    (item) => item.questionId === questionId && item.patientId === patientId,
  )
}

/** 같은 사람이 다시 누르면 취소한다. 새 배열을 준다. */
export function toggleEmpathy(
  empathies: Empathy[],
  questionId: string,
  patientId: string,
  at: string,
): Empathy[] {
  if (hasEmpathized(empathies, questionId, patientId)) {
    return empathies.filter(
      (item) => !(item.questionId === questionId && item.patientId === patientId),
    )
  }

  return [...empathies, { questionId, patientId, at }]
}

/**
 * 주간 공감 집계로 상단 고정 대상을 정한다.
 *
 * 기준일은 항상 인자다. Date.now()를 쓰면 테스트가 달력에 묶인다.
 * 창은 [weekEndingOn - windowDays + 1, weekEndingOn] 양끝 포함이다.
 * 비공개 글은 공감 기록이 있어도 순위에 넣지 않는다.
 */
export function rankWeeklyHot(
  questions: Question[],
  empathies: Empathy[],
  ruleSet: BoardRuleSet,
  weekEndingOn: string,
): WeeklyRank[] {
  const windowEnd = dayStart(weekEndingOn) + 86_400_000
  const windowStart = dayStart(weekEndingOn) - (ruleSet.windowDays - 1) * 86_400_000

  const counted = questions.filter(isPubliclyListed).map((question) => {
    const own = empathies.filter((item) => item.questionId === question.id)
    const weeklyCount = own.filter((item) => {
      const at = Date.parse(item.at)
      return at >= windowStart && at < windowEnd
    }).length

    return {
      questionId: question.id,
      weeklyCount,
      totalCount: own.length,
      createdAt: question.createdAt,
      isHot: false,
    }
  })

  const hotIds = new Set(
    [...counted]
      .filter((item) => item.weeklyCount >= ruleSet.minWeeklyCount)
      .sort(
        (a, b) =>
          b.weeklyCount - a.weeklyCount ||
          b.totalCount - a.totalCount ||
          b.createdAt.localeCompare(a.createdAt) ||
          a.questionId.localeCompare(b.questionId),
      )
      .slice(0, ruleSet.hotLimit)
      .map((item) => item.questionId),
  )

  return counted.map(({ createdAt: _createdAt, ...rank }) => ({
    ...rank,
    isHot: hotIds.has(rank.questionId),
  }))
}

/** HOT을 위로 올리고 나머지는 최신순. 동점 처리까지 결정적이다. */
export function orderBoard(questions: Question[], ranks: WeeklyRank[]): Question[] {
  const byId = new Map(ranks.map((rank) => [rank.questionId, rank]))
  const listed = questions.filter(isPubliclyListed)

  const hot = listed
    .filter((question) => byId.get(question.id)?.isHot)
    .sort((a, b) => {
      const rankA = byId.get(a.id)!
      const rankB = byId.get(b.id)!
      return (
        rankB.weeklyCount - rankA.weeklyCount ||
        rankB.totalCount - rankA.totalCount ||
        b.createdAt.localeCompare(a.createdAt) ||
        a.id.localeCompare(b.id)
      )
    })

  const rest = listed
    .filter((question) => !byId.get(question.id)?.isHot)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id))

  return [...hot, ...rest]
}
