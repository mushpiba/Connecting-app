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
          selectedSymptoms: [],
          painLevel: null,
          intakeAnswers: [],
        },
        intakeRules,
      )

      return Promise.resolve(withPatientWordsOnly(triage(text, triageRules), input.text))
    },
  }
}

/**
 * 근거 키워드를 환자가 실제로 쓴 말로 좁힌다.
 *
 * 부위 체크박스는 점수에는 반영돼야 하지만 근거로 표시되면 안 된다. 환자가
 * 적지도 않은 "인후통"이 근거 칩으로 뜨면 화면이 환자 말을 지어낸 것이 된다.
 * 점수는 확장 텍스트로 계산한 값을 그대로 두고 표시용 목록만 거른다.
 */
export function withPatientWordsOnly(result: TriageResult, patientText: string): TriageResult {
  return {
    ...result,
    suggestions: result.suggestions.map((suggestion) => ({
      ...suggestion,
      matchedKeywords: suggestion.matchedKeywords.filter((keyword) =>
        patientText.includes(keyword),
      ),
    })),
  }
}
