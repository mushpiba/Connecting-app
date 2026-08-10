import { buildTriageText } from './intake'
import { triage } from './triage'
import type { BodyArea, IntakeRuleSet, TriageResult, TriageRuleSet } from './types'

export interface ClassifierInput {
  text: string
  bodyAreas: BodyArea[]
}

/**
 * 증상 분류기. 지금은 키워드 규칙이 구현이지만 나중에 LLM 분류기로 갈아끼운다.
 *
 * classify가 Promise를 주는 이유는 그것 하나뿐이다. 동기로 두면 LLM이 들어오는
 * 날 호출부를 전부 고쳐야 한다. 지금 await 하나를 미리 낸다.
 *
 * id와 asOf는 근거 표시용이다. 규칙 분류기는 규칙셋 이름을, LLM 분류기는
 * 모델 id와 프롬프트 버전을 채우면 화면은 그대로 둔다.
 */
export interface SymptomClassifier {
  readonly id: string
  readonly asOf: string
  classify(input: ClassifierInput): Promise<TriageResult>
}

export function createRuleClassifier(
  triageRules: TriageRuleSet,
  intakeRules: IntakeRuleSet,
): SymptomClassifier {
  return {
    id: triageRules.name,
    asOf: triageRules.asOf,
    classify(input) {
      const text = buildTriageText(
        {
          title: '',
          body: input.text,
          onsetDate: '',
          course: 'unchanged',
          bodyAreas: input.bodyAreas,
          dailyImpact: 'none',
          triedRemedies: [],
          region: '',
          priorVisit: null,
          sameSymptoms: false,
          visibility: 'public',
        },
        intakeRules,
      )

      return Promise.resolve(triage(text, triageRules))
    },
  }
}
