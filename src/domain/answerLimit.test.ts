import { answerAllowance } from './answerLimit'
import { answerLimitRuleSet } from '../data/rules/answerLimitRules'
import type { Answer } from './types'

function answer(overrides: Partial<Answer> = {}): Answer {
  return {
    id: 'a-1',
    questionId: 'q-1',
    doctorId: 'd-1',
    body: '기록을 2주만 적어 오시면 이야기가 빨라집니다.',
    createdAt: '2026-08-12T01:00:00.000Z',
    ...overrides,
  }
}

describe('answerAllowance', () => {
  it('아무것도 안 썼으면 상한 그대로 남는다', () => {
    const allowance = answerAllowance([], 'd-1', '2026-08-12', answerLimitRuleSet)

    expect(allowance.remaining).toBe(5)
    expect(allowance.headline).toBe('오늘 남은 답변 5회')
    expect(allowance.detail).toContain('자정')
  })

  it('오늘 쓴 것만 센다', () => {
    const allowance = answerAllowance(
      [answer(), answer({ id: 'a-2', createdAt: '2026-08-11T23:00:00.000Z' })],
      'd-1',
      '2026-08-12',
      answerLimitRuleSet,
    )

    expect(allowance.used).toBe(1)
    expect(allowance.remaining).toBe(4)
  })

  it('남의 답변은 세지 않는다', () => {
    const allowance = answerAllowance(
      [answer({ doctorId: 'd-2' })],
      'd-1',
      '2026-08-12',
      answerLimitRuleSet,
    )

    expect(allowance.used).toBe(0)
  })

  it('한 건 남으면 그 한 건을 어디에 쓸지 알려준다', () => {
    const four = Array.from({ length: 4 }, (_, index) => answer({ id: `a-${index}` }))
    const allowance = answerAllowance(four, 'd-1', '2026-08-12', answerLimitRuleSet)

    expect(allowance.headline).toBe('오늘 남은 답변 1회')
    expect(allowance.detail).toContain('가장 급해 보이는 사연')
  })

  it('다 쓰면 차단이 아니라 완결로 말한다', () => {
    const five = Array.from({ length: 5 }, (_, index) => answer({ id: `a-${index}` }))
    const allowance = answerAllowance(five, 'd-1', '2026-08-12', answerLimitRuleSet)

    expect(allowance.exhausted).toBe(true)
    expect(allowance.remaining).toBe(0)
    expect(allowance.detail).toContain('오늘 할 일은 끝났습니다')
    // 우회로를 붙이지 않는다. 상한은 규제 자산이다 (C-2 파생 4).
    expect(allowance.detail).not.toContain('더 쓰려면')
  })

  it('상한을 넘겨도 남은 횟수가 음수로 내려가지 않는다', () => {
    const six = Array.from({ length: 6 }, (_, index) => answer({ id: `a-${index}` }))

    expect(answerAllowance(six, 'd-1', '2026-08-12', answerLimitRuleSet).remaining).toBe(0)
  })

  it('상한 값은 규칙 파일에서 온다', () => {
    const allowance = answerAllowance([], 'd-1', '2026-08-12', {
      ...answerLimitRuleSet,
      dailyLimit: 3,
    })

    expect(allowance.limit).toBe(3)
    expect(allowance.headline).toBe('오늘 남은 답변 3회')
  })
})
