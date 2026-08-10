import type { MedicationDecision, MedicationRuleSet } from './types'

/** 처방 후보 하나에 대해 비대면 처방 제한 여부를 판정한다. */
export function checkMedication(
  medicationId: string,
  ruleSet: MedicationRuleSet,
): MedicationDecision | null {
  const rule = ruleSet.medications[medicationId]
  if (!rule) return null

  return {
    ...rule,
    source: ruleSet.source,
    asOf: ruleSet.asOf,
    evidenceUrl: ruleSet.evidenceUrl,
  }
}

export function listMedications(ruleSet: MedicationRuleSet): MedicationDecision[] {
  return Object.keys(ruleSet.medications)
    .map((id) => checkMedication(id, ruleSet))
    .filter((decision): decision is MedicationDecision => decision !== null)
}

export function searchMedications(
  query: string,
  ruleSet: MedicationRuleSet,
): MedicationDecision[] {
  const trimmed = query.trim()
  if (!trimmed) return listMedications(ruleSet)

  return listMedications(ruleSet).filter(
    (decision) =>
      decision.name.includes(trimmed) ||
      decision.category.includes(trimmed) ||
      decision.medicationId.includes(trimmed.toLowerCase()),
  )
}
