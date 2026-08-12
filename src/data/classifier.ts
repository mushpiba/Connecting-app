import { createLlmClassifier, createRuleClassifier } from '../domain/classifier'
import type { SymptomClassifier } from '../domain/classifier'
import { classifyWithModel } from './classifyTransport'
import { specialtyLabels } from './specialtyLabels'
import { isLiveMode } from './supabaseClient'
import { intakeRuleSet } from './rules/intakeRules'
import { triageRuleSet } from './rules/triageRules'

/** 시연용 분류기. 나중에 LLM 분류기로 갈아끼울 자리다. */
export const demoClassifier = createRuleClassifier(triageRuleSet, intakeRuleSet)

/**
 * 실제로 쓰는 분류기.
 *
 * 라이브에서는 모델에게 먼저 묻고, 못 받으면 규칙으로 간다. 테스트와 오프라인
 * 데모는 규칙만 쓴다. 테스트가 남의 서버에 기대면 안 되고, 무엇보다 검증하려는
 * 것은 화면 동작이지 모델 성능이 아니다.
 */
export const appClassifier: SymptomClassifier = isLiveMode
  ? createLlmClassifier(classifyWithModel, demoClassifier, (value) =>
      specialtyLabels[value as keyof typeof specialtyLabels] ?? null,
    )
  : demoClassifier
