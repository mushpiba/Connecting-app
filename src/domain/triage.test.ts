import { describe, expect, it } from 'vitest'
import { triageRuleSet } from '../data/rules/triageRules'
import { triage } from './triage'

describe('triage', () => {
  it('증상 키워드에서 진료과 후보를 뽑는다', () => {
    const result = triage('콧물이랑 코막힘이 심하고 재채기가 계속 납니다', triageRuleSet)

    expect(result.suggestions[0].specialty).toBe('otolaryngology')
    expect(result.suggestions[0].matchedKeywords).toContain('콧물')
  })

  it('후보를 최대 3개까지만 준다', () => {
    const result = triage(
      '복통 설사 콧물 기침 두드러기 가려움 허리 무릎 불면 불안 눈 충혈',
      triageRuleSet,
    )

    expect(result.suggestions.length).toBeLessThanOrEqual(3)
  })

  it('일치하는 키워드가 없으면 후보를 비운다', () => {
    const result = triage('그냥 궁금해서 물어봅니다', triageRuleSet)

    expect(result.suggestions).toEqual([])
  })

  it('응급 신호를 잡아낸다', () => {
    const result = triage('갑자기 가슴통증이 있고 식은땀이 납니다', triageRuleSet)

    expect(result.redFlags.map((flag) => flag.id)).toContain('chest-pain')
    expect(result.redFlags[0].guidance).toContain('119')
  })

  it('응급 신호가 없으면 빈 배열을 준다', () => {
    const result = triage('콧물이 납니다', triageRuleSet)

    expect(result.redFlags).toEqual([])
  })

  it('진단명이나 확률은 결과에 담지 않는다', () => {
    const result = triage('콧물이 납니다', triageRuleSet)

    expect(Object.keys(result)).toEqual(['suggestions', 'redFlags', 'ruleSetName', 'ruleSetAsOf'])
  })
})
