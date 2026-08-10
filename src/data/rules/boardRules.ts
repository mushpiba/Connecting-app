import type { BoardRuleSet } from '../../domain/types'

/**
 * 자유게시판 주간 정렬 규칙. 여러 과를 돌았지만 답을 못 얻은 사례가
 * 다른 과 의사들 눈에도 걸리게 하는 장치다. 값이 바뀌면 이 파일만 고친다.
 */
export const boardRuleSet: BoardRuleSet = {
  name: '주간 공감 정렬 시연 규칙',
  asOf: '2026-08-09',
  windowDays: 7,
  hotLimit: 3,
  minWeeklyCount: 3,
}
