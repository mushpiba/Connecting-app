import type { Answer, AnswerLimitRuleSet } from './types'

export interface AnswerAllowance {
  limit: number
  /** 오늘 이미 쓴 공개 답변 수. */
  used: number
  remaining: number
  exhausted: boolean
  /** 상단에 상시 세우는 한 줄. */
  headline: string
  /** 언제 다시 채워지는지. 이것이 없으면 희소성이 아니라 그냥 막힘이다. */
  detail: string
}

/** 0시는 「자정」이라고 부른다. 「0시에 채워집니다」는 아무도 그렇게 말하지 않는다. */
function resetLabel(hourKst: number): string {
  return hourKst === 0 ? '자정' : `${hourKst}시`
}

/**
 * 오늘 남은 답변 횟수.
 *
 * 세는 것은 **공개 답변만**이다. 비공개 덧붙임 회신은 새 노출이 아니라 이미 한
 * 답변의 연장이고, 세면 의사가 답변을 아끼느라 회신을 안 하게 된다 (D-8).
 *
 * 기준일을 인자로 받는다. 여기서 Date를 부르면 같은 함수가 테스트마다 다른 답을
 * 내고, 그러면 상한이 언제 채워지는지를 화면이 증명할 수 없다 (원칙 8).
 *
 * ⚠️ **R-6 · 이 판정은 브라우저에서 돈다.** 화면이 막아도 API를 직접 부르면
 * 6번째 답변이 들어간다. 그러면 상한을 규제 자산으로 쓰는 논거(C-2 파생 4)가
 * 무너진다. **서버 강제는 R-6이고 M3다.** 그 사이에 실제 환자를 태우지 않는다 —
 * 그것이 M3가 있는 이유다.
 */
export function answerAllowance(
  answers: Answer[],
  doctorId: string,
  today: string,
  rules: AnswerLimitRuleSet,
): AnswerAllowance {
  const used = answers.filter(
    (answer) => answer.doctorId === doctorId && answer.createdAt.slice(0, 10) === today,
  ).length
  const remaining = Math.max(0, rules.dailyLimit - used)
  const reset = resetLabel(rules.resetHourKst)

  // 상한에 닿았을 때의 문구는 차단이 아니라 완결로 쓴다. 「오늘 할 일은
  // 끝났습니다」를 지우지 않는다. 이 한 줄이 상한을 벌이 아니라 완결로 만든다.
  // 「더 쓰려면 …」 같은 우회로는 절대 붙이지 않는다 (D-8).
  if (remaining === 0) {
    return {
      limit: rules.dailyLimit,
      used,
      remaining,
      exhausted: true,
      headline: `오늘 답변 ${rules.dailyLimit}회를 다 썼습니다`,
      detail: `내일 ${reset}에 다시 채워집니다. 오늘 할 일은 끝났습니다.`,
    }
  }

  return {
    limit: rules.dailyLimit,
    used,
    remaining,
    exhausted: false,
    headline: `오늘 남은 답변 ${remaining}회`,
    detail:
      remaining === 1
        ? '한 건 남았습니다. 가장 급해 보이는 사연에 쓰세요'
        : `매일 ${reset}에 ${rules.dailyLimit}회로 다시 채워집니다`,
  }
}
