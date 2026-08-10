import { describe, expect, it } from 'vitest'
import { medicationRuleSet } from '../data/rules/medicationRules'
import { checkMedication, listMedications, searchMedications } from './medication'

describe('checkMedication', () => {
  it('허용 성분에 출처와 기준일을 붙여 돌려준다', () => {
    const decision = checkMedication('cetirizine', medicationRuleSet)

    expect(decision?.status).toBe('allowed')
    expect(decision?.asOf).toBe(medicationRuleSet.asOf)
    expect(decision?.evidenceUrl).toBe(medicationRuleSet.evidenceUrl)
  })

  it('금지 성분에 사유를 남긴다', () => {
    const decision = checkMedication('zolpidem', medicationRuleSet)

    expect(decision?.status).toBe('prohibited')
    expect(decision?.reason).toContain('향정신성')
  })

  it('목록에 없는 성분은 null을 준다', () => {
    expect(checkMedication('unknown-drug', medicationRuleSet)).toBeNull()
  })
})

describe('searchMedications', () => {
  it('빈 검색어는 전체 목록을 준다', () => {
    expect(searchMedications('  ', medicationRuleSet)).toHaveLength(
      listMedications(medicationRuleSet).length,
    )
  })

  it('성분명으로 찾는다', () => {
    const found = searchMedications('졸피뎀', medicationRuleSet)

    expect(found).toHaveLength(1)
    expect(found[0].medicationId).toBe('zolpidem')
  })

  it('분류로도 찾는다', () => {
    const found = searchMedications('항히스타민제', medicationRuleSet)

    expect(found.map((item) => item.medicationId).sort()).toEqual(['cetirizine', 'loratadine'])
  })
})
