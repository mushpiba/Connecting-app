import { intakeRuleSet } from '../data/rules/intakeRules'
import { triageRuleSet } from '../data/rules/triageRules'
import { createRuleClassifier } from './classifier'
import { buildTriageText, canChoosePriorClinicOnly, inferAreas, symptomDurationDays } from './intake'
import { triage } from './triage'
import type { IntakeForm } from './types'

function form(overrides: Partial<IntakeForm> = {}): IntakeForm {
  return {
    title: '콧물이 안 멎어요',
    body: '2주째 콧물이 계속 납니다.',
    onsetDate: '2026-07-27',
    course: 'unchanged',
    bodyAreas: [],
    dailyImpact: 'mild',
    triedRemedies: ['otc'],
    region: '인천 미추홀구',
    priorVisit: null,
    sameSymptoms: false,
    visibility: 'public',
    selectedSymptoms: [],
    painLevel: null,
    intakeAnswers: [],
    ...overrides,
  }
}

describe('buildTriageText', () => {
  it('제목과 본문을 그대로 담는다', () => {
    const text = buildTriageText(form(), intakeRuleSet)

    expect(text).toContain('콧물이 안 멎어요')
    expect(text).toContain('2주째 콧물이 계속 납니다.')
  })

  it('선택한 부위를 진료과 키워드로 펼친다', () => {
    const text = buildTriageText(form({ bodyAreas: ['musculoskeletal'] }), intakeRuleSet)

    expect(text).toContain('허리')
    expect(text).toContain('관절')
  })

  it('부위를 선택하면 그 진료과 점수가 올라간다', () => {
    const plain = triage(buildTriageText(form(), intakeRuleSet), triageRuleSet)
    const withArea = triage(
      buildTriageText(form({ bodyAreas: ['musculoskeletal'] }), intakeRuleSet),
      triageRuleSet,
    )

    expect(plain.suggestions.map((item) => item.specialty)).not.toContain('orthopedics')
    expect(withArea.suggestions.map((item) => item.specialty)).toContain('orthopedics')
  })

  it('잘 모르겠어요는 아무것도 더하지 않는다', () => {
    const text = buildTriageText(form({ bodyAreas: ['unsure'] }), intakeRuleSet)

    expect(text).toBe(buildTriageText(form(), intakeRuleSet))
  })

  it('부위 선택만으로는 응급 신호가 켜지지 않는다', () => {
    const areas = Object.keys(intakeRuleSet.areaKeywords) as IntakeForm['bodyAreas']
    const text = buildTriageText(form({ title: '', body: '', bodyAreas: areas }), intakeRuleSet)

    expect(triage(text, triageRuleSet).redFlags).toEqual([])
  })

  it('자유 텍스트만으로도 동작한다', () => {
    const text = buildTriageText(form({ title: '', bodyAreas: [] }), intakeRuleSet)

    expect(triage(text, triageRuleSet).suggestions[0].specialty).toBe('otolaryngology')
  })
})

describe('symptomDurationDays', () => {
  it('시작일 당일을 1일째로 센다', () => {
    expect(symptomDurationDays('2026-08-09', '2026-08-09')).toBe(1)
  })

  it('기준일까지 며칠째인지 센다', () => {
    expect(symptomDurationDays('2026-07-27', '2026-08-09')).toBe(14)
  })
})

describe('canChoosePriorClinicOnly', () => {
  it('진료 이력을 밝혔으면 고를 수 있다', () => {
    expect(
      canChoosePriorClinicOnly({
        priorVisit: { clinicId: 'clinic-han', visitedOn: '2026-06-02', selfReported: true },
      }),
    ).toBe(true)
  })

  it('진료 이력이 없으면 고를 수 없다', () => {
    expect(canChoosePriorClinicOnly({ priorVisit: null })).toBe(false)
  })
})

describe('createRuleClassifier', () => {
  it('규칙 분류기는 triage와 같은 결과를 준다', async () => {
    const classifier = createRuleClassifier(triageRuleSet, intakeRuleSet)
    const result = await classifier.classify({ text: '콧물이랑 코막힘', bodyAreas: [] })

    expect(result).toEqual(triage('콧물이랑 코막힘', triageRuleSet))
  })

  it('분류 근거로 규칙셋 이름과 기준일을 남긴다', () => {
    const classifier = createRuleClassifier(triageRuleSet, intakeRuleSet)

    expect(classifier.id).toBe(triageRuleSet.name)
    expect(classifier.asOf).toBe(triageRuleSet.asOf)
  })
})

describe('inferAreas', () => {
  it('적은 내용에서 범주를 잡는다', () => {
    const result = triage('콧물이랑 코막힘이 심합니다', triageRuleSet)

    expect(inferAreas([], result)).toContain('ent')
  })

  it('고른 부위와 합친다', () => {
    const result = triage('콧물이 납니다', triageRuleSet)

    expect(inferAreas(['skin'], result)).toEqual(expect.arrayContaining(['skin', 'ent']))
  })

  it('잘 모르겠어요는 범주로 세지 않는다', () => {
    const result = triage('그냥 궁금해서요', triageRuleSet)

    expect(inferAreas(['unsure'], result)).toEqual([])
  })

  /**
   * '질' 한 글자가 키워드였을 때 "질문"에 걸려 산부인과가 1순위로 올라왔고,
   * 코·목 증상을 적은 사람에게 마지막 생리 시작일을 묻게 됐다.
   */
  it('민감한 범주는 추론으로 열지 않는다', () => {
    const result = triage('질문드립니다. 목이 아파요', triageRuleSet)

    expect(inferAreas([], result)).not.toContain('womens')
  })

  it('민감한 범주도 직접 고르면 연다', () => {
    const result = triage('콧물이 납니다', triageRuleSet)

    expect(inferAreas(['womens'], result)).toContain('womens')
  })

  it('같은 범주가 두 번 들어가지 않는다', () => {
    const result = triage('콧물 코막힘 기침', triageRuleSet)

    expect(inferAreas(['ent'], result)).toEqual(['ent'])
  })
})
