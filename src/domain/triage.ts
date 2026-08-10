import type { RedFlag, TriageResult, TriageRuleSet, TriageSuggestion } from './types'

function countMatches(text: string, keywords: string[]): string[] {
  return keywords.filter((keyword) => text.includes(keyword))
}

/**
 * 환자가 쓴 증상 문장에서 진료과 후보와 응급 신호를 뽑는다.
 * 진단명과 확률은 만들지 않는다. 의료기기 해당 여부 판단에서 불리해지는 출력이다.
 *
 * 후보는 선두 점수 대비 상대 임계값으로 거른다. 절대 최소 점수를 쓰면
 * "콧물이 납니다" 같은 짧은 입력에서 후보가 하나도 남지 않는다.
 */
export function triage(text: string, ruleSet: TriageRuleSet): TriageResult {
  const normalized = text.replace(/\s+/g, ' ').trim()

  const scored: TriageSuggestion[] = ruleSet.specialties
    .map((rule) => {
      const matchedKeywords = countMatches(normalized, rule.keywords)
      return {
        specialty: rule.specialty,
        label: rule.label,
        matchedKeywords,
        score: matchedKeywords.length,
      }
    })
    .filter((suggestion) => suggestion.score > 0)
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))

  const topScore = scored.length > 0 ? scored[0].score : 0

  const suggestions = scored
    .filter((suggestion) => suggestion.score > topScore * ruleSet.relativeScoreFloor)
    .slice(0, ruleSet.maxSuggestions)

  const redFlags: RedFlag[] = ruleSet.redFlags
    .map((rule) => ({
      id: rule.id,
      label: rule.label,
      guidance: rule.guidance,
      matchedKeywords: countMatches(normalized, rule.keywords),
    }))
    .filter((flag) => flag.matchedKeywords.length > 0)

  return {
    suggestions,
    redFlags,
    ruleSetName: ruleSet.name,
    ruleSetAsOf: ruleSet.asOf,
  }
}
