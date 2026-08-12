import { createLlmClassifier, createRuleClassifier } from './classifier'
import type { ModelVerdict } from './classifier'
import { intakeRuleSet } from '../data/rules/intakeRules'
import { triageRuleSet } from '../data/rules/triageRules'
import { specialtyLabels } from '../data/specialtyLabels'

const rules = createRuleClassifier(triageRuleSet, intakeRuleSet)
const labelOf = (value: string) => specialtyLabels[value as keyof typeof specialtyLabels] ?? null

function classifier(transport: () => Promise<ModelVerdict[]>) {
  return createLlmClassifier(transport, rules, labelOf)
}

const spoken = { text: '목이 아프고 침 삼킬 때 따가워요', bodyAreas: [] }

describe('createLlmClassifier', () => {
  it('사전이 못 잡는 구어체를 모델이 잡는다', async () => {
    const result = await classifier(async () => [
      { specialty: 'otolaryngology', evidence: ['목이 아프고', '침 삼킬 때'] },
    ]).classify(spoken)

    expect(result.suggestions[0].specialty).toBe('otolaryngology')
    expect(result.suggestions[0].matchedKeywords).toContain('목이 아프고')
  })

  it('모델이 지어낸 말은 근거로 쓰지 않는다', async () => {
    const result = await classifier(async () => [
      { specialty: 'otolaryngology', evidence: ['목이 아프고', '급성 편도염'] },
    ]).classify(spoken)

    expect(result.suggestions[0].matchedKeywords).toEqual(['목이 아프고'])
  })

  it('모르는 진료과는 버린다', async () => {
    const result = await classifier(async () => [
      { specialty: 'cardiology', evidence: ['목이 아프고'] },
    ]).classify(spoken)

    expect(result.suggestions.map((item) => String(item.specialty))).not.toContain('cardiology')
  })

  it('모델이 실패하면 규칙 결과를 그대로 쓴다', async () => {
    const failing = classifier(async () => {
      throw new Error('timeout')
    })

    const result = await failing.classify({ text: '콧물이 계속 납니다', bodyAreas: [] })

    expect(result.suggestions[0].specialty).toBe('otolaryngology')
    expect(result.ruleSetName).not.toContain('모델')
  })

  /* 응급 판정은 규칙이 한다. 모델이 무엇을 말하든 가슴 통증은 걸려야 한다. */
  it('응급 신호는 모델이 답해도 규칙이 판단한다', async () => {
    const result = await classifier(async () => [
      { specialty: 'psychiatry', evidence: ['불안'] },
    ]).classify({ text: '불안한데 가슴통증도 있어요', bodyAreas: [] })

    expect(result.redFlags.map((flag) => flag.id)).toContain('chest-pain')
  })
})
