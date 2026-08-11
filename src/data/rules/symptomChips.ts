import type { BodyArea } from '../../domain/types'

export interface SymptomChip {
  /** 화면에 찍히는 말. 의학용어는 괄호로 일상어를 붙인다. */
  label: string
  /** 분류에 넣을 말. 라벨의 괄호를 뺀 형태다. */
  keyword: string
}

export interface SymptomChipGroup {
  area: BodyArea
  label: string
  /** 무엇을 적어야 하는지 알려주는 한 줄. 빈 칸만 두면 아무도 적지 않는다. */
  tip: string
  chips: SymptomChip[]
}

export interface SymptomChipRuleSet {
  name: string
  asOf: string
  groups: SymptomChipGroup[]
}

/**
 * 부위를 고르면 그 부위의 증상 칩이 열린다.
 *
 * 칩은 환자가 무엇을 적어야 할지 모를 때의 출발점이다. 자유 서술을 대체하지
 * 않는다. 고른 칩은 본문에 그대로 담기므로 근거 표시가 지어낸 말이 되지 않는다.
 *
 * 진단명은 넣지 않는다. 환자가 고르는 것은 자기가 느끼는 것이지 병명이 아니다.
 */
export const symptomChipRuleSet: SymptomChipRuleSet = {
  name: '증상 선택지 시연 규칙',
  asOf: '2026-08-12',
  groups: [
    {
      area: 'ent',
      label: '코·목·귀',
      tip: '언제부터인지, 한쪽만 그런지 함께 적어 주세요.',
      chips: [
        { label: '콧물', keyword: '콧물' },
        { label: '코막힘', keyword: '코막힘' },
        { label: '재채기', keyword: '재채기' },
        { label: '인후통 (목 아픔)', keyword: '인후통' },
        { label: '기침', keyword: '기침' },
        { label: '가래', keyword: '가래' },
        { label: '목쉼', keyword: '목쉼' },
        { label: '귀 먹먹함', keyword: '중이염' },
        { label: '이명 (귀 울림)', keyword: '이명' },
        { label: '어지럼', keyword: '어지럼' },
      ],
    },
    {
      area: 'general',
      label: '감기·몸살·전반',
      tip: '열이 몇 도까지 올랐는지, 언제 심한지 적어 주세요.',
      chips: [
        { label: '발열', keyword: '발열' },
        { label: '미열', keyword: '미열' },
        { label: '오한 (춥고 떨림)', keyword: '오한' },
        { label: '몸살', keyword: '몸살' },
        { label: '피로', keyword: '피로' },
        { label: '두통', keyword: '두통' },
        { label: '식은땀', keyword: '땀' },
        { label: '체중 변화', keyword: '체중' },
      ],
    },
    {
      area: 'digestive',
      label: '배·소화',
      tip: '식사와 어떤 관계가 있는지 적어 주세요.',
      chips: [
        { label: '복통', keyword: '복통' },
        { label: '속쓰림', keyword: '속쓰림' },
        { label: '소화불량', keyword: '소화' },
        { label: '메스꺼움', keyword: '메스꺼움' },
        { label: '구토', keyword: '구토' },
        { label: '설사', keyword: '설사' },
        { label: '변비', keyword: '변비' },
        { label: '더부룩함', keyword: '소화' },
      ],
    },
    {
      area: 'skin',
      label: '피부',
      tip: '어디에 생겼는지, 사진으로 남겨 둘 만한지 적어 주세요.',
      chips: [
        { label: '두드러기', keyword: '두드러기' },
        { label: '발진', keyword: '발진' },
        { label: '가려움', keyword: '가려움' },
        { label: '여드름', keyword: '여드름' },
        { label: '습진', keyword: '습진' },
        { label: '탈모', keyword: '탈모' },
        { label: '무좀', keyword: '무좀' },
      ],
    },
    {
      area: 'musculoskeletal',
      label: '허리·관절·근육',
      tip: '어떤 동작에서 아픈지 적어 주세요.',
      chips: [
        { label: '허리 통증', keyword: '허리' },
        { label: '무릎 통증', keyword: '무릎' },
        { label: '어깨 통증', keyword: '어깨' },
        { label: '목 통증', keyword: '목디스크' },
        { label: '손목 통증', keyword: '손목' },
        { label: '발목 통증', keyword: '발목' },
        { label: '삐끗함', keyword: '삐끗' },
        { label: '근육통', keyword: '근육통' },
      ],
    },
    {
      area: 'mind',
      label: '마음·수면',
      tip: '얼마나 오래됐는지, 하루 중 언제 힘든지 적어 주세요.',
      chips: [
        { label: '잠들기 어려움', keyword: '불면' },
        { label: '자주 깸', keyword: '잠' },
        { label: '불안', keyword: '불안' },
        { label: '우울', keyword: '우울' },
        { label: '가슴 두근거림', keyword: '공황' },
        { label: '집중 어려움', keyword: '집중' },
        { label: '스트레스', keyword: '스트레스' },
      ],
    },
    {
      area: 'eye',
      label: '눈',
      tip: '한쪽인지 양쪽인지 적어 주세요.',
      chips: [
        { label: '충혈', keyword: '충혈' },
        { label: '눈 시림', keyword: '눈' },
        { label: '눈부심', keyword: '눈부심' },
        { label: '눈물', keyword: '눈물' },
        { label: '시야 흐림', keyword: '시야' },
        { label: '이물감', keyword: '결막' },
      ],
    },
    {
      area: 'urinary',
      label: '소변',
      tip: '하루 몇 번인지, 언제부터인지 적어 주세요.',
      chips: [
        { label: '소변 자주 마려움', keyword: '소변' },
        { label: '배뇨 통증', keyword: '배뇨' },
        { label: '잔뇨감', keyword: '방광' },
        { label: '혈뇨', keyword: '혈뇨' },
      ],
    },
    {
      area: 'womens',
      label: '여성 건강',
      tip: '마지막 생리 시작일을 함께 적어 주세요.',
      chips: [
        { label: '생리통', keyword: '생리' },
        { label: '생리 불규칙', keyword: '월경' },
        { label: '분비물', keyword: '분비물' },
        { label: '가려움', keyword: '질' },
      ],
    },
    {
      area: 'child',
      label: '아이 문제',
      tip: '아이 나이와 열이 몇 도인지 적어 주세요.',
      chips: [
        { label: '열', keyword: '아이' },
        { label: '기침', keyword: '기침' },
        { label: '보챔', keyword: '아기' },
        { label: '먹지 않음', keyword: '이유식' },
        { label: '발진', keyword: '소아' },
      ],
    },
  ],
}

export function chipGroupsFor(areas: BodyArea[]): SymptomChipGroup[] {
  return symptomChipRuleSet.groups.filter((group) => areas.includes(group.area))
}
