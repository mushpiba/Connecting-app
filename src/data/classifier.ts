import { createRuleClassifier } from '../domain/classifier'
import { intakeRuleSet } from './rules/intakeRules'
import { triageRuleSet } from './rules/triageRules'

/** 시연용 분류기. 나중에 LLM 분류기로 갈아끼울 자리다. */
export const demoClassifier = createRuleClassifier(triageRuleSet, intakeRuleSet)
