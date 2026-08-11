import type { BodyArea } from '../../domain/types'

export type IntakeQuestionKind = 'scale' | 'single' | 'multi' | 'number'

export interface IntakeQuestionOption {
  value: string
  label: string
}

export interface IntakeQuestion {
  id: string
  /** 'all'이면 부위와 무관하게 늘 묻는다. */
  areas: BodyArea[] | 'all'
  label: string
  kind: IntakeQuestionKind
  help?: string
  /** 어디서 가져온 문항인지. 화면에 근거로 표시한다. */
  source?: string
  min?: number
  max?: number
  minLabel?: string
  maxLabel?: string
  unit?: string
  options?: IntakeQuestionOption[]
}

export interface QuestionBankRuleSet {
  name: string
  asOf: string
  questions: IntakeQuestion[]
}

/**
 * 문진 문항 사전.
 *
 * 두 종류만 담는다. 환자가 스스로 세거나 고를 수 있는 사실, 그리고 환자가
 * 자기 느낌을 고르는 서술 척도다. 어느 쪽도 우리가 점수를 합산해 판정하지
 * 않는다. 원값 그대로 의사에게 넘긴다.
 *
 * PHQ-9 이나 GAD-7 같은 선별도구는 넣지 않는다. 총점으로 무엇을 의심한다고
 * 말하는 순간 선별검사가 되고, 그건 우리가 만들 물건이 아니다. 대신 그 안에
 * 들어 있는 사실 문항의 성격만 가져온다. 며칠째인지, 몇 번 깨는지 같은 것들이다.
 *
 * 근거를 밝힌 척도는 널리 쓰이고 서술이 공개된 것만 골랐다.
 * mMRC 호흡곤란 척도, Bristol 대변 척도다. 통증 NRS는 전용 입력이라
 * 여기 담지 않고 화면에서 따로 받는다.
 */
export const questionBankRuleSet: QuestionBankRuleSet = {
  name: '문진 문항 시연 사전',
  asOf: '2026-08-12',
  questions: [
    {
      id: 'symptom-timing',
      areas: 'all',
      label: '하루 중 언제 가장 심한가요',
      kind: 'single',
      options: [
        { value: 'morning', label: '아침' },
        { value: 'day', label: '낮' },
        { value: 'evening', label: '저녁' },
        { value: 'night', label: '밤·새벽' },
        { value: 'no-pattern', label: '일정하지 않음' },
      ],
    },
    {
      id: 'fever-peak',
      areas: ['general', 'ent', 'child'],
      label: '가장 높았던 체온',
      kind: 'number',
      unit: '℃',
      min: 35,
      max: 42,
      help: '재보지 않았으면 비워 두셔도 됩니다.',
    },
    {
      id: 'sputum-color',
      areas: ['ent', 'general'],
      label: '가래 색',
      kind: 'single',
      options: [
        { value: 'none', label: '가래 없음' },
        { value: 'clear', label: '투명' },
        { value: 'white', label: '흰색' },
        { value: 'yellow', label: '노란색' },
        { value: 'green', label: '초록색' },
        { value: 'blood', label: '피가 섞임' },
      ],
    },
    {
      id: 'breathlessness',
      areas: ['ent', 'general'],
      label: '숨이 차는 정도',
      kind: 'single',
      source: 'mMRC 호흡곤란 척도',
      options: [
        { value: '0', label: '힘든 운동을 할 때만' },
        { value: '1', label: '평지를 빨리 걷거나 언덕을 오를 때' },
        { value: '2', label: '평지에서 또래보다 천천히 걸음' },
        { value: '3', label: '100m 정도 걸으면 쉬어야 함' },
        { value: '4', label: '옷 입기 같은 일에도 숨이 참' },
      ],
    },
    {
      id: 'meal-relation',
      areas: ['digestive'],
      label: '식사와 어떤 관계가 있나요',
      kind: 'single',
      options: [
        { value: 'before', label: '공복일 때 심함' },
        { value: 'after', label: '식후에 심함' },
        { value: 'none', label: '관계없음' },
      ],
    },
    {
      id: 'stool-form',
      areas: ['digestive'],
      label: '변 모양',
      kind: 'single',
      source: 'Bristol 대변 척도',
      options: [
        { value: '1', label: '딱딱한 덩어리로 끊어짐' },
        { value: '2', label: '울퉁불퉁한 소시지 모양' },
        { value: '3', label: '표면에 금이 간 소시지 모양' },
        { value: '4', label: '매끈한 소시지 모양' },
        { value: '5', label: '가장자리가 분명한 덩어리' },
        { value: '6', label: '가장자리가 흐린 죽 모양' },
        { value: '7', label: '완전히 물' },
      ],
    },
    {
      id: 'sleep-latency',
      areas: ['mind'],
      label: '잠들기까지 걸리는 시간',
      kind: 'number',
      unit: '분',
      min: 0,
      max: 300,
    },
    {
      id: 'night-wakings',
      areas: ['mind'],
      label: '밤에 깨는 횟수',
      kind: 'number',
      unit: '회',
      min: 0,
      max: 20,
    },
    {
      id: 'skin-spread',
      areas: ['skin'],
      label: '번지는 양상',
      kind: 'single',
      options: [
        { value: 'spreading', label: '점점 넓어짐' },
        { value: 'same', label: '그 자리에 그대로' },
        { value: 'moving', label: '났다가 사라지고 다른 곳에 남' },
      ],
    },
    {
      id: 'joint-trigger',
      areas: ['musculoskeletal'],
      label: '언제 아픈가요',
      kind: 'multi',
      options: [
        { value: 'rest', label: '가만히 있어도' },
        { value: 'move', label: '움직일 때' },
        { value: 'stairs', label: '계단 오르내릴 때' },
        { value: 'morning', label: '아침에 뻣뻣함' },
        { value: 'night', label: '밤에 심함' },
      ],
    },
    {
      id: 'eye-side',
      areas: ['eye'],
      label: '어느 쪽인가요',
      kind: 'single',
      options: [
        { value: 'left', label: '왼쪽' },
        { value: 'right', label: '오른쪽' },
        { value: 'both', label: '양쪽' },
      ],
    },
    {
      id: 'urinary-frequency',
      areas: ['urinary'],
      label: '하루 소변 횟수',
      kind: 'number',
      unit: '회',
      min: 0,
      max: 40,
    },
    {
      id: 'last-period',
      areas: ['womens'],
      label: '마지막 생리 시작일로부터',
      kind: 'number',
      unit: '일 전',
      min: 0,
      max: 400,
    },
    {
      id: 'child-intake',
      areas: ['child'],
      label: '먹고 마시는 정도',
      kind: 'single',
      options: [
        { value: 'normal', label: '평소와 같음' },
        { value: 'less', label: '평소보다 덜 먹음' },
        { value: 'refuse', label: '거의 못 먹음' },
      ],
    },
    {
      id: 'medications',
      areas: 'all',
      label: '현재 복용 중인 약이 있나요',
      kind: 'single',
      options: [
        { value: 'none', label: '없음' },
        { value: 'otc', label: '약국에서 산 약' },
        { value: 'prescription', label: '처방받은 약' },
        { value: 'both', label: '둘 다' },
      ],
      help: '약 이름은 진료 때 의사에게 알려 주세요.',
    },
    {
      id: 'allergy',
      areas: 'all',
      label: '약이나 음식 알레르기가 있나요',
      kind: 'single',
      options: [
        { value: 'none', label: '없음' },
        { value: 'yes', label: '있음' },
        { value: 'unknown', label: '모르겠음' },
      ],
    },
  ],
}

export function questionsFor(areas: BodyArea[]): IntakeQuestion[] {
  return questionBankRuleSet.questions.filter(
    (question) =>
      question.areas === 'all' || question.areas.some((area) => areas.includes(area)),
  )
}
