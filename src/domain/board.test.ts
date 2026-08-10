import { boardRuleSet } from '../data/rules/boardRules'
import { triageRuleSet } from '../data/rules/triageRules'
import { empathyCount, hasEmpathized, orderBoard, rankWeeklyHot, toggleEmpathy } from './board'
import { triage } from './triage'
import type { Empathy, Question } from './types'

const weekEndingOn = '2026-08-09'

function question(id: string, overrides: Partial<Question> = {}): Question {
  return {
    id,
    patientId: 'pat-1',
    title: `질문 ${id}`,
    body: '콧물이 납니다.',
    createdAt: '2026-08-01T09:00:00.000Z',
    triage: triage('콧물이 납니다.', triageRuleSet),
    priorVisit: null,
    sameSymptoms: false,
    visibility: 'public',
    onsetDate: '2026-07-27',
    course: 'unchanged',
    dailyImpact: 'mild',
    triedRemedies: ['none'],
    bodyAreas: [],
    ...overrides,
  }
}

function empathies(questionId: string, count: number, at: string): Empathy[] {
  return Array.from({ length: count }, (_, index) => ({
    questionId,
    patientId: `pat-${questionId}-${index}`,
    at,
  }))
}

function rankOf(ranks: ReturnType<typeof rankWeeklyHot>, id: string) {
  return ranks.find((item) => item.questionId === id)
}

describe('rankWeeklyHot', () => {
  it('지난 7일 안의 공감만 주간 집계에 넣는다', () => {
    const ranks = rankWeeklyHot(
      [question('q-a')],
      [
        ...empathies('q-a', 2, '2026-08-03T00:00:00.000Z'),
        ...empathies('q-a', 1, '2026-08-09T23:59:00.000Z'),
        ...empathies('q-a', 4, '2026-08-02T23:59:00.000Z'),
      ],
      boardRuleSet,
      weekEndingOn,
    )

    expect(rankOf(ranks, 'q-a')?.weeklyCount).toBe(3)
    expect(rankOf(ranks, 'q-a')?.totalCount).toBe(7)
  })

  it('주간 공감이 많은 순으로 HOT을 정한다', () => {
    const ranks = rankWeeklyHot(
      [question('q-a'), question('q-b')],
      [
        ...empathies('q-a', 3, '2026-08-05T00:00:00.000Z'),
        ...empathies('q-b', 6, '2026-08-05T00:00:00.000Z'),
      ],
      boardRuleSet,
      weekEndingOn,
    )

    expect(rankOf(ranks, 'q-b')?.isHot).toBe(true)
    expect(rankOf(ranks, 'q-a')?.isHot).toBe(true)
    expect(rankOf(ranks, 'q-b')!.weeklyCount).toBeGreaterThan(rankOf(ranks, 'q-a')!.weeklyCount)
  })

  it('HOT은 최대 3개까지만 고정한다', () => {
    const ids = ['q-a', 'q-b', 'q-c', 'q-d', 'q-e']
    const ranks = rankWeeklyHot(
      ids.map((id) => question(id)),
      ids.flatMap((id, index) => empathies(id, 3 + index, '2026-08-05T00:00:00.000Z')),
      boardRuleSet,
      weekEndingOn,
    )

    expect(ranks.filter((item) => item.isHot).map((item) => item.questionId)).toEqual([
      'q-c',
      'q-d',
      'q-e',
    ])
  })

  it('주간 공감이 기준 미만이면 HOT으로 올리지 않는다', () => {
    const ranks = rankWeeklyHot(
      [question('q-a')],
      empathies('q-a', 2, '2026-08-05T00:00:00.000Z'),
      boardRuleSet,
      weekEndingOn,
    )

    expect(rankOf(ranks, 'q-a')?.isHot).toBe(false)
  })

  it('비공개 글은 순위에 넣지 않는다', () => {
    const ranks = rankWeeklyHot(
      [question('q-a', { visibility: 'specialty-only' }), question('q-b')],
      [
        ...empathies('q-a', 9, '2026-08-05T00:00:00.000Z'),
        ...empathies('q-b', 3, '2026-08-05T00:00:00.000Z'),
      ],
      boardRuleSet,
      weekEndingOn,
    )

    expect(ranks.map((item) => item.questionId)).toEqual(['q-b'])
  })
})

describe('orderBoard', () => {
  const questions = [
    question('q-old', { createdAt: '2026-07-20T09:00:00.000Z' }),
    question('q-hot', { createdAt: '2026-07-25T09:00:00.000Z' }),
    question('q-new', { createdAt: '2026-08-08T09:00:00.000Z' }),
    question('q-hidden', { visibility: 'prior-clinic-only' }),
  ]
  const records = empathies('q-hot', 4, '2026-08-05T00:00:00.000Z')

  it('HOT을 상단에 고정하고 나머지는 최신순으로 잇는다', () => {
    const ranks = rankWeeklyHot(questions, records, boardRuleSet, weekEndingOn)

    expect(orderBoard(questions, ranks).map((item) => item.id)).toEqual([
      'q-hot',
      'q-new',
      'q-old',
    ])
  })

  it('주간 공감이 같으면 누적 공감이 많은 글을 위에 둔다', () => {
    const tied = [question('q-a'), question('q-b')]
    const records2 = [
      ...empathies('q-a', 3, '2026-08-05T00:00:00.000Z'),
      ...empathies('q-a', 5, '2026-07-01T00:00:00.000Z'),
      ...empathies('q-b', 3, '2026-08-05T00:00:00.000Z'),
    ]
    const ranks = rankWeeklyHot(tied, records2, boardRuleSet, weekEndingOn)

    expect(orderBoard(tied, ranks).map((item) => item.id)).toEqual(['q-a', 'q-b'])
  })

  it('비공개 글은 목록에 넣지 않는다', () => {
    const ranks = rankWeeklyHot(questions, records, boardRuleSet, weekEndingOn)

    expect(orderBoard(questions, ranks).map((item) => item.id)).not.toContain('q-hidden')
  })

  it('같은 입력에 항상 같은 순서를 만든다', () => {
    const ranks = rankWeeklyHot(questions, records, boardRuleSet, weekEndingOn)

    expect(orderBoard(questions, ranks)).toEqual(orderBoard(questions, ranks))
  })
})

describe('toggleEmpathy', () => {
  it('처음 누르면 공감이 쌓인다', () => {
    const next = toggleEmpathy([], 'q-a', 'pat-1', '2026-08-09T10:00:00.000Z')

    expect(empathyCount(next, 'q-a')).toBe(1)
    expect(hasEmpathized(next, 'q-a', 'pat-1')).toBe(true)
  })

  it('같은 사람이 두 번 누르면 취소된다', () => {
    const once = toggleEmpathy([], 'q-a', 'pat-1', '2026-08-09T10:00:00.000Z')
    const twice = toggleEmpathy(once, 'q-a', 'pat-1', '2026-08-09T10:01:00.000Z')

    expect(empathyCount(twice, 'q-a')).toBe(0)
  })

  it('다른 사람이 누르면 각각 집계된다', () => {
    const first = toggleEmpathy([], 'q-a', 'pat-1', '2026-08-09T10:00:00.000Z')
    const second = toggleEmpathy(first, 'q-a', 'pat-2', '2026-08-09T10:01:00.000Z')

    expect(empathyCount(second, 'q-a')).toBe(2)
  })
})
