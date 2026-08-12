import { triage } from './triage'
import type { TranscriptLine, TriageRuleSet } from './types'

export interface ConsultKeyword {
  label: string
  /** 누가 한 말에서 나왔는지. 의사가 되짚을 때 필요하다. */
  speaker: TranscriptLine['speaker']
  lineId: string
}

/**
 * 통화 중 오간 말에서 키워드를 뽑는다.
 *
 * 사연을 분류할 때 쓰는 규칙셋을 그대로 쓴다. 통화용 규칙을 따로 만들면 두
 * 곳의 기준이 갈라지고, 어느 쪽이 맞는지 아무도 모르게 된다.
 *
 * 진단명은 만들지 않는다. 여기서 나오는 것은 말에 실제로 있었던 단어다.
 */
export function extractConsultKeywords(
  lines: TranscriptLine[],
  ruleSet: TriageRuleSet,
): ConsultKeyword[] {
  const seen = new Set<string>()

  return lines.flatMap((line) => {
    const result = triage(line.text, ruleSet)
    const words = result.suggestions.flatMap((suggestion) => suggestion.matchedKeywords)

    return words.flatMap((label) => {
      if (seen.has(label)) return []
      seen.add(label)
      return [{ label, speaker: line.speaker, lineId: line.id }]
    })
  })
}

/** 통화 중 나온 응급 신호. 의사가 놓치면 안 되는 것이라 따로 뽑는다. */
export function consultRedFlags(lines: TranscriptLine[], ruleSet: TriageRuleSet) {
  const seen = new Set<string>()

  return lines.flatMap((line) =>
    triage(line.text, ruleSet).redFlags.flatMap((flag) => {
      if (seen.has(flag.id)) return []
      seen.add(flag.id)
      return [{ ...flag, lineId: line.id }]
    }),
  )
}

/**
 * 양쪽에서 온 줄을 시간순으로 합친다.
 *
 * 각자 자기 마이크만 전사해 상대에게 보내므로 두 갈래가 따로 도착한다.
 * 같은 id가 두 번 오면 나중 것을 버린다. 재전송이 겹칠 수 있다.
 */
export function mergeTranscript(
  existing: TranscriptLine[],
  incoming: TranscriptLine[],
): TranscriptLine[] {
  const byId = new Map(existing.map((line) => [line.id, line]))
  for (const line of incoming) {
    if (!byId.has(line.id)) byId.set(line.id, line)
  }

  return [...byId.values()].sort((left, right) => left.at.localeCompare(right.at))
}

/** 전사본을 진료기록 초안 문장으로 만든다. 의사가 고쳐 쓰는 출발점이다. */
export function transcriptToRecordDraft(lines: TranscriptLine[]): string {
  if (lines.length === 0) return ''

  const patient = lines.filter((line) => line.speaker === 'patient').map((line) => line.text)
  const doctor = lines.filter((line) => line.speaker === 'doctor').map((line) => line.text)

  return [
    '[환자 진술]',
    patient.join(' ') || '(기록 없음)',
    '',
    '[상담 내용]',
    doctor.join(' ') || '(기록 없음)',
    '',
    '위 내용은 통화 전사를 그대로 옮긴 초안이며 의료진이 확인하고 확정해야 합니다.',
  ].join('\n')
}
