import type { RedFlag, TriageResult, TriageRuleSet, TriageSuggestion } from './types'

const MAX_SUGGESTIONS = 3

function countMatches(text: string, keywords: string[]): string[] {
  return keywords.filter((keyword) => text.includes(keyword))
}

/**
 * 환자가 쓴 증상 문장에서 진료과 후보와 응급 신호를 뽑는다.
 * 진단명과 확률은 만들지 않는다. 의료기기 해당 여부 판단에서 불리해지는 출력이다.
 */
export function triage(text: string, ruleSet: TriageRuleSet): TriageResult {
  const normalized = text.replace(/\s+/g, ' ').trim()

  const suggestions: TriageSuggestion[] = ruleSet.specialties
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
    .slice(0, MAX_SUGGESTIONS)

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
