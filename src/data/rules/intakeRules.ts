import type { IntakeRuleSet } from '../../domain/types'

/**
 * 문진 양식의 부위 선택을 진료과 분류용 키워드로 펼치는 표.
 *
 * 토큰은 전부 triageRules의 진료과 키워드에서 가져온다. 응급 신호 키워드는
 * 하나도 넣지 않는다. 체크박스 한 번으로 119 안내가 뜨면 그건 증상 체크리스트가
 * 아니라 선별검사 도구가 된다.
 *
 * 한 부위당 두 토큰을 넣어 체크박스가 본문에 스친 단어 하나보다 무겁게 만든다.
 */
export const intakeRuleSet: IntakeRuleSet = {
  name: '문진 부위 확장 시연 규칙',
  asOf: '2026-08-09',
  areaKeywords: {
    ent: ['콧물', '인후통'],
    eye: ['눈', '충혈'],
    skin: ['피부', '가려움'],
    digestive: ['소화', '복통'],
    musculoskeletal: ['허리', '관절'],
    mind: ['불안', '불면'],
    urinary: ['소변', '배뇨'],
    womens: ['생리', '분비물'],
    child: ['아이', '소아'],
    general: ['감기', '몸살'],
    unsure: [],
  },
}
