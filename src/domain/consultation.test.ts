import { triageRuleSet } from '../data/rules/triageRules'
import {
  consultRedFlags,
  extractConsultKeywords,
  mergeTranscript,
  transcriptToRecordDraft,
} from './consultation'
import type { TranscriptLine } from './types'

function line(id: string, speaker: TranscriptLine['speaker'], text: string, at: string): TranscriptLine {
  return { id, speaker, text, at }
}

const lines: TranscriptLine[] = [
  line('l1', 'patient', '콧물이 계속 나고 코막힘이 심합니다', '2026-08-12T01:00:00.000Z'),
  line('l2', 'doctor', '언제부터 그러셨나요', '2026-08-12T01:00:10.000Z'),
  line('l3', 'patient', '2주 됐고 기침도 납니다', '2026-08-12T01:00:20.000Z'),
]

describe('extractConsultKeywords', () => {
  it('말에 실제로 있었던 단어만 뽑는다', () => {
    const keywords = extractConsultKeywords(lines, triageRuleSet).map((item) => item.label)

    expect(keywords).toContain('콧물')
    expect(keywords).toContain('코막힘')
    expect(keywords).toContain('기침')
  })

  it('누가 한 말인지 남긴다', () => {
    const found = extractConsultKeywords(lines, triageRuleSet).find((item) => item.label === '콧물')

    expect(found?.speaker).toBe('patient')
    expect(found?.lineId).toBe('l1')
  })

  it('같은 단어를 두 번 담지 않는다', () => {
    const keywords = extractConsultKeywords(
      [...lines, line('l4', 'patient', '콧물이 또 납니다', '2026-08-12T01:00:30.000Z')],
      triageRuleSet,
    )

    expect(keywords.filter((item) => item.label === '콧물')).toHaveLength(1)
  })

  it('말이 없으면 아무것도 뽑지 않는다', () => {
    expect(extractConsultKeywords([], triageRuleSet)).toEqual([])
  })
})

describe('consultRedFlags', () => {
  it('통화 중 나온 응급 신호를 잡는다', () => {
    const flags = consultRedFlags(
      [line('l9', 'patient', '가슴통증이 있고 식은땀도 납니다', '2026-08-12T01:01:00.000Z')],
      triageRuleSet,
    )

    expect(flags.map((flag) => flag.id)).toContain('chest-pain')
  })

  it('같은 신호를 두 번 담지 않는다', () => {
    const flags = consultRedFlags(
      [
        line('l9', 'patient', '가슴통증이 있습니다', '2026-08-12T01:01:00.000Z'),
        line('l10', 'patient', '가슴통증이 또 옵니다', '2026-08-12T01:02:00.000Z'),
      ],
      triageRuleSet,
    )

    expect(flags).toHaveLength(1)
  })
})

describe('mergeTranscript', () => {
  it('시간순으로 합친다', () => {
    const merged = mergeTranscript([lines[0], lines[2]], [lines[1]])

    expect(merged.map((item) => item.id)).toEqual(['l1', 'l2', 'l3'])
  })

  it('같은 줄이 두 번 오면 하나만 남긴다', () => {
    const merged = mergeTranscript(lines, [lines[0], lines[1]])

    expect(merged).toHaveLength(3)
  })

  it('빈 쪽을 합쳐도 그대로다', () => {
    expect(mergeTranscript(lines, [])).toHaveLength(3)
  })
})

describe('transcriptToRecordDraft', () => {
  it('환자 진술과 상담 내용을 나눠 적는다', () => {
    const draft = transcriptToRecordDraft(lines)

    expect(draft).toContain('[환자 진술]')
    expect(draft).toContain('콧물이 계속 나고 코막힘이 심합니다')
    expect(draft).toContain('[상담 내용]')
    expect(draft).toContain('언제부터 그러셨나요')
  })

  it('의료진이 확정해야 한다는 것을 남긴다', () => {
    expect(transcriptToRecordDraft(lines)).toContain('의료진이 확인하고 확정')
  })

  it('전사가 없으면 빈 문자열이다', () => {
    expect(transcriptToRecordDraft([])).toBe('')
  })
})
