import {
  awaitingDoctorReply,
  findExpressionHits,
  maxCharsFor,
  privateThreadStage,
  threadForAnswer,
  toFilterHitRecords,
} from './privateThread'
import { privateThreadRuleSet } from '../data/rules/privateThreadRules'
import type { PrivateMessage, PrivateThread } from './types'

const rules = privateThreadRuleSet

function message(overrides: Partial<PrivateMessage> = {}): PrivateMessage {
  return {
    id: 'm-1',
    threadId: 't-1',
    senderId: 'pat-min',
    senderRole: 'patient',
    body: '답변 고맙습니다. 하나만 더 여쭤볼게요.',
    createdAt: '2026-08-09T01:00:00.000Z',
    ...overrides,
  }
}

function thread(overrides: Partial<PrivateThread> = {}): PrivateThread {
  return {
    id: 't-1',
    questionId: 'q-nose',
    answerId: 'a-nose-1',
    patientId: 'pat-min',
    doctorId: 'doc-han-ent',
    createdAt: '2026-08-09T01:00:00.000Z',
    ...overrides,
  }
}

/**
 * 경계 문구로 쓴다. 「무엇이 걸리나」가 아니라 「지시와 지식이 갈리는 자리가
 * 어디인가」가 이 필터의 요건이다 — 막는 것은 지시이지 지식이 아니다.
 */
describe('findExpressionHits · 경계', () => {
  it('검사 지시는 막고 같은 검사명의 설명은 통과시킨다', () => {
    expect(findExpressionHits('내시경 받으세요.', rules).map((hit) => hit.ruleId)).toContain('PT-4')
    expect(findExpressionHits('내시경으로 봐야 하는 경우가 많습니다.', rules)).toEqual([])
  })

  it('진단 단정은 막고 가능성 서술은 통과시킨다', () => {
    expect(findExpressionHits('위염입니다.', rules).map((hit) => hit.ruleId)).toContain('PT-3')
    expect(findExpressionHits('위염일 수 있습니다.', rules)).toEqual([])
  })

  it('처방·용법 지시를 막는다', () => {
    expect(findExpressionHits('하루 3회 복용하세요.', rules).map((hit) => hit.ruleId)).toContain(
      'PT-1',
    )
    expect(findExpressionHits('식후 30분에 드시면 됩니다.', rules).map((hit) => hit.ruleId)).toContain(
      'PT-1',
    )
  })

  it('약품명은 medicationRules 의 이름을 그대로 잡는다 — 새 목록을 만들지 않았다', () => {
    expect(findExpressionHits('로라타딘이 도움이 됩니다.', rules).map((hit) => hit.ruleId)).toContain(
      'PT-2',
    )
    // 괄호 안 상품명도 낱말로 선다.
    expect(findExpressionHits('삭센다를 쓰면 됩니다.', rules).map((hit) => hit.ruleId)).toContain(
      'PT-2',
    )
  })

  it('의료기관 유치를 막는다 — 일반명사인 「종합병원」은 걸지 않는다', () => {
    expect(findExpressionHits('우리 병원으로 오세요.', rules).map((hit) => hit.ruleId)).toContain(
      'PT-5',
    )
    expect(findExpressionHits('한마음의원에서 봐 드릴게요.', rules).map((hit) => hit.ruleId)).toContain(
      'PT-5',
    )
    expect(findExpressionHits('종합병원 진료를 권합니다.', rules)).toEqual([])
  })

  it('걸린 조각과 자리를 함께 준다 — 어디가 걸렸는지 모르면 고칠 수 없다', () => {
    const [hit] = findExpressionHits('그러면 내시경 받으세요.', rules)

    expect(hit.span).toBe('내시경 받으세요')
    expect(hit.index).toBe(4)
    expect(hit.message).toContain('「내시경 받으세요」')
  })

  it('뭉뚱그린 문구를 쓰지 않는다 — 규칙마다 다른 문장이 나간다', () => {
    const prescription = findExpressionHits('처방해 드릴게요.', rules)[0]
    const diagnosis = findExpressionHits('비염입니다.', rules)[0]

    expect(prescription.message).not.toBe(diagnosis.message)
    expect(diagnosis.message).toContain('가능성으로 적어 주세요')
  })

  it('일반적인 회신은 아무것도 걸지 않는다', () => {
    expect(
      findExpressionHits(
        '2주 넘게 이어지면 이비인후과에서 확인해 보시는 편이 좋습니다. 코막힘이 한쪽에만 있는지 살펴보세요.',
        rules,
      ),
    ).toEqual([])
  })
})

describe('toFilterHitRecords', () => {
  it('본문을 남기지 않는다 — 막으려고 만든 장치가 새 보관소가 되면 안 된다', () => {
    const body = '졸피뎀타르타르산염을 하루 1정 복용하세요. 불면이 심하시군요.'
    const [record] = toFilterHitRecords(
      findExpressionHits(body, rules),
      'doc-han-ent',
      'private-message',
      { threadId: 't-1' },
      rules,
      '2026-08-09T02:00:00.000Z',
    )

    expect(JSON.stringify(record)).not.toContain('불면이 심하시군요')
    expect(Object.keys(record)).not.toContain('body')
    expect(record.matchedSpan.length).toBeLessThanOrEqual(20)
    expect(record.questionId).toBeNull()
    expect(record.threadId).toBe('t-1')
  })

  it('그때의 규칙셋 기준일을 함께 남긴다 — 지나간 판정은 바뀌면 안 된다', () => {
    const [record] = toFilterHitRecords(
      findExpressionHits('확진입니다.', rules),
      'doc-han-ent',
      'public-answer',
      { questionId: 'q-nose' },
      rules,
      '2026-08-09T02:00:00.000Z',
    )

    expect(record.ruleSetAsOf).toBe(rules.asOf)
    expect(record.surface).toBe('public-answer')
  })
})

describe('privateThreadStage · 왕복 상한', () => {
  it('빈 대화에서는 환자 차례이고 남은 왕복이 상한 그대로다', () => {
    const stage = privateThreadStage([], rules)

    expect(stage.turn).toBe('patient')
    expect(stage.roundsLeft).toBe(3)
    expect(stage.exhausted).toBe(false)
  })

  it('환자가 말하면 의사 차례가 된다 — 환자가 연달아 밀어 넣을 수 없다', () => {
    const stage = privateThreadStage([message()], rules)

    expect(stage.turn).toBe('doctor')
    expect(stage.roundsLeft).toBe(2)
  })

  it('3왕복을 다 쓰면 아무도 말할 수 없다 — 그 자체가 닫힘이다', () => {
    const full = [0, 1, 2].flatMap((round) => [
      message({ id: `p-${round}`, createdAt: `2026-08-09T0${round * 2 + 1}:00:00.000Z` }),
      message({
        id: `d-${round}`,
        senderRole: 'doctor',
        senderId: 'doc-han-ent',
        createdAt: `2026-08-09T0${round * 2 + 2}:00:00.000Z`,
      }),
    ])
    const stage = privateThreadStage(full, rules)

    expect(stage.turn).toBeNull()
    expect(stage.exhausted).toBe(true)
    expect(stage.roundsLeft).toBe(0)
  })

  it('마지막 발화권은 의사에게 간다 — 환자가 상한을 다 써도 회신은 남는다', () => {
    const stage = privateThreadStage(
      [
        message({ id: 'p-1', createdAt: '2026-08-09T01:00:00.000Z' }),
        message({ id: 'd-1', senderRole: 'doctor', createdAt: '2026-08-09T02:00:00.000Z' }),
        message({ id: 'p-2', createdAt: '2026-08-09T03:00:00.000Z' }),
        message({ id: 'd-2', senderRole: 'doctor', createdAt: '2026-08-09T04:00:00.000Z' }),
        message({ id: 'p-3', createdAt: '2026-08-09T05:00:00.000Z' }),
      ],
      rules,
    )

    expect(stage.roundsLeft).toBe(0)
    expect(stage.turn).toBe('doctor')
    expect(stage.exhausted).toBe(false)
  })
})

describe('maxCharsFor', () => {
  it('의사 쪽이 더 짧다 — 의도한 비대칭이다', () => {
    expect(maxCharsFor('patient', rules)).toBe(500)
    expect(maxCharsFor('doctor', rules)).toBe(400)
    expect(maxCharsFor('doctor', rules)).toBeLessThan(maxCharsFor('patient', rules))
  })
})

describe('awaitingDoctorReply · Q-9', () => {
  it('내 회신 차례인 대화만, 오래 기다린 것부터 센다', () => {
    const threads = [thread(), thread({ id: 't-2', answerId: 'a-nose-2' })]
    const messages = [
      message({ id: 'p-old', threadId: 't-2', createdAt: '2026-08-09T00:30:00.000Z' }),
      message({ id: 'p-new', threadId: 't-1', createdAt: '2026-08-09T01:00:00.000Z' }),
    ]

    const waiting = awaitingDoctorReply(threads, messages, 'doc-han-ent', rules)

    expect(waiting.map((item) => item.thread.id)).toEqual(['t-2', 't-1'])
  })

  it('내 차례가 아닌 대화와 상한을 다 쓴 대화는 세지 않는다', () => {
    const messages = [
      message({ id: 'p-1', createdAt: '2026-08-09T01:00:00.000Z' }),
      message({
        id: 'd-1',
        senderRole: 'doctor',
        senderId: 'doc-han-ent',
        createdAt: '2026-08-09T02:00:00.000Z',
      }),
    ]

    expect(awaitingDoctorReply([thread()], messages, 'doc-han-ent', rules)).toEqual([])
  })

  it('남의 대화는 세지 않는다', () => {
    expect(
      awaitingDoctorReply([thread()], [message()], 'doc-forest-fm', rules),
    ).toEqual([])
  })
})

describe('threadForAnswer', () => {
  it('답변 카드 하나에 대화 하나다', () => {
    const threads = [thread(), thread({ id: 't-2', answerId: 'a-nose-2' })]

    expect(threadForAnswer(threads, 'a-nose-2', 'pat-min')?.id).toBe('t-2')
    expect(threadForAnswer(threads, 'a-rash-1', 'pat-min')).toBeNull()
  })
})
