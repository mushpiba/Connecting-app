import type { Specialty } from '../domain/types'
import { triageRuleSet } from './rules/triageRules'

/**
 * 진료과의 한국어 이름 한 자리.
 *
 * 화면마다 따로 들고 있으면 한 곳을 빠뜨리고, 빠뜨린 곳에서는 otolaryngology
 * 같은 내부 값이 그대로 환자에게 나간다. 실제로 의사 프로필 설정에서 그랬다.
 * 규칙셋이 이미 진료과마다 이름을 들고 있으므로 거기서 만든다.
 */
export const specialtyLabels = Object.fromEntries(
  triageRuleSet.specialties.map((rule) => [rule.specialty, rule.label]),
) as Record<Specialty, string>

export function specialtyLabel(specialty: Specialty): string {
  return specialtyLabels[specialty] ?? specialty
}
