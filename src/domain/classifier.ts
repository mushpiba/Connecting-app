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

/**
 * 모델에게 물어보고 돌아온 답. 전송 방법은 도메인이 모른다.
 *
 * 도메인에 fetch 를 두지 않는 이유는 이 계층을 서버로도 옮길 수 있어야 하기
 * 때문이다. 부르는 방법은 바깥에서 넣는다.
 */
export interface ModelVerdict {
  /** 진료과 값. 아는 값이 아니면 버린다. */
  specialty: string
  /** 그렇게 본 근거. 환자 글에 실제로 있는 말이어야 한다. */
  evidence: string[]
}

export type ModelTransport = (input: ClassifierInput) => Promise<ModelVerdict[]>

/**
 * 모델로 진료과를 고르고, 안 되면 규칙으로 돌아간다.
 *
 * 규칙 사전은 부분 문자열로 맞추기 때문에 "목이 아프고 침 삼킬 때 따가워요"를
 * 못 잡는다. 조사와 어순과 동의어를 사전으로 따라잡는 데는 끝이 없다. 사람이
 * 쓰는 말을 사람처럼 읽는 쪽이 맞다.
 *
 * 다만 넘기지 않는 것이 둘 있다.
 *
 * 첫째, 응급 신호는 계속 규칙이 판단한다. 가슴 통증을 놓치는 일에 "모델이
 * 그렇게 봤다"는 사후 설명은 쓸 수 없다. 규칙은 무엇이 왜 걸렸는지 남고
 * 프롬프트로 흔들리지 않는다.
 *
 * 둘째, 근거로 보여 주는 말은 환자 글에 실제로 있던 것만 쓴다. 모델이 지어낸
 * 의학 용어가 근거 칩으로 뜨면 화면이 환자 말을 대신 만들어 낸 것이 된다.
 *
 * 모델이 답을 못 주거나 늦으면 규칙 결과를 그대로 쓴다. 분류가 늦다고 사연을
 * 못 올리게 두지 않는다.
 */
export function createLlmClassifier(
  transport: ModelTransport,
  fallback: SymptomClassifier,
  labelOf: (specialty: string) => string | null,
): SymptomClassifier {
  return {
    id: `llm+${fallback.id}`,
    asOf: fallback.asOf,
    async classify(input) {
      const ruleResult = await fallback.classify(input)

      let verdicts: ModelVerdict[]
      try {
        verdicts = await transport(input)
      } catch {
        return ruleResult
      }

      const suggestions = verdicts
        .map((verdict) => {
          const label = labelOf(verdict.specialty)
          if (label === null) return null

          return {
            specialty: verdict.specialty as TriageResult['suggestions'][number]['specialty'],
            label,
            matchedKeywords: verdict.evidence,
            score: 1,
          }
        })
        .filter((item): item is TriageResult['suggestions'][number] => item !== null)

      if (suggestions.length === 0) return ruleResult

      return withPatientWordsOnly(
        { ...ruleResult, suggestions, ruleSetName: `${ruleResult.ruleSetName} + 모델 분류` },
        input.text,
      )
    },
  }
}
