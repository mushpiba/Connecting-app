import { buildTriageText } from '../domain/intake'
import { triage } from '../domain/triage'
import type { Answer, Empathy, IntakeForm, Patient, Question } from '../domain/types'
import { intakeRuleSet } from './rules/intakeRules'
import { triageRuleSet } from './rules/triageRules'

export const demoPatients: Patient[] = [
  { id: 'pat-min', displayName: '가상 민이', region: '인천 미추홀구', monthlyTelemedicineCount: 0 },
  { id: 'pat-soo', displayName: '가상 수현', region: '서울 성동구', monthlyTelemedicineCount: 1 },
  { id: 'pat-jae', displayName: '가상 재우', region: '서울 강남구', monthlyTelemedicineCount: 0 },
]

export const demoCurrentPatientId = 'pat-min'

type QuestionSeed = Pick<Question, 'id' | 'patientId' | 'createdAt'> &
  Pick<
    IntakeForm,
    | 'title'
    | 'body'
    | 'onsetDate'
    | 'course'
    | 'bodyAreas'
    | 'dailyImpact'
    | 'triedRemedies'
    | 'priorVisit'
    | 'sameSymptoms'
    | 'visibility'
  >

/**
 * triage 결과를 리터럴로 붙여넣지 않고 규칙셋으로 계산한다.
 * 순수 함수에 고정 규칙셋이라 결과는 결정적이고, 규칙이 바뀌면 픽스처가
 * 조용히 어긋나는 대신 곧바로 드러난다.
 */
function toQuestion(seed: QuestionSeed): Question {
  const triageText = buildTriageText(
    {
      title: seed.title,
      body: seed.body,
      onsetDate: seed.onsetDate,
      course: seed.course,
      bodyAreas: seed.bodyAreas,
      dailyImpact: seed.dailyImpact,
      triedRemedies: seed.triedRemedies,
      region: '',
      priorVisit: seed.priorVisit,
      sameSymptoms: seed.sameSymptoms,
      visibility: seed.visibility,
    },
    intakeRuleSet,
  )

  return { ...seed, triage: triage(triageText, triageRuleSet) }
}

const seeds: QuestionSeed[] = [
  {
    id: 'q-nose',
    patientId: 'pat-min',
    title: '2주째 콧물과 코막힘이 안 나아요',
    body: '콧물이 계속 나고 코막힘 때문에 밤에 잠을 설칩니다. 약국 약을 먹어도 그대로입니다.',
    createdAt: '2026-08-08T09:10:00.000Z',
    onsetDate: '2026-07-27',
    course: 'unchanged',
    bodyAreas: ['ent'],
    dailyImpact: 'disruptive',
    triedRemedies: ['otc'],
    priorVisit: { clinicId: 'clinic-han', visitedOn: '2026-06-02', selfReported: true },
    sameSymptoms: true,
    visibility: 'public',
  },
  {
    id: 'q-rash',
    patientId: 'pat-soo',
    title: '세 과를 돌았는데 두드러기 원인을 못 찾았어요',
    body:
      '넉 달째 저녁마다 두드러기가 올라오고 가려움이 심합니다. 피부 검사도 받았고 내과도 갔는데 원인을 못 찾았습니다. 비슷한 경험 있으신 분 계실까요.',
    createdAt: '2026-07-25T11:00:00.000Z',
    onsetDate: '2026-04-10',
    course: 'fluctuating',
    bodyAreas: ['skin'],
    dailyImpact: 'severe',
    triedRemedies: ['otc', 'clinic'],
    priorVisit: null,
    sameSymptoms: false,
    visibility: 'public',
  },
  {
    id: 'q-sleep',
    patientId: 'pat-jae',
    title: '두 달째 잠이 안 옵니다',
    body: '누워도 두세 시간은 뒤척이고 새벽에 자꾸 깹니다. 불안한 생각이 계속 돕니다.',
    createdAt: '2026-08-05T22:30:00.000Z',
    onsetDate: '2026-06-08',
    course: 'worsening',
    bodyAreas: ['mind'],
    dailyImpact: 'severe',
    triedRemedies: ['rest'],
    priorVisit: null,
    sameSymptoms: false,
    visibility: 'public',
  },
  {
    id: 'q-stomach',
    patientId: 'pat-soo',
    title: '식후 속쓰림이 반복됩니다',
    body: '한 달 전부터 밥 먹고 나면 속이 쓰리고 신물이 올라옵니다.',
    createdAt: '2026-08-07T13:20:00.000Z',
    onsetDate: '2026-07-06',
    course: 'unchanged',
    bodyAreas: ['digestive'],
    dailyImpact: 'mild',
    triedRemedies: ['otc'],
    priorVisit: null,
    sameSymptoms: false,
    visibility: 'specialty-only',
  },
  {
    id: 'q-followup',
    patientId: 'pat-min',
    title: '지난번 처방 이후 경과를 여쭙습니다',
    body: '지난 진료에서 받은 약을 다 먹었는데 코막힘이 조금 남았습니다. 같은 증상입니다.',
    createdAt: '2026-08-09T08:40:00.000Z',
    onsetDate: '2026-07-27',
    course: 'improving',
    bodyAreas: ['ent'],
    dailyImpact: 'mild',
    triedRemedies: ['clinic'],
    priorVisit: { clinicId: 'clinic-han', visitedOn: '2026-06-02', selfReported: true },
    sameSymptoms: true,
    visibility: 'prior-clinic-only',
  },
  {
    id: 'q-chest',
    patientId: 'pat-jae',
    title: '가슴통증이 있었는데 그냥 둬도 될까요',
    body: '어제 가슴 통증이 있었고 식은땀도 났습니다. 지금은 괜찮아졌는데 걱정됩니다.',
    createdAt: '2026-08-09T07:05:00.000Z',
    onsetDate: '2026-08-08',
    course: 'improving',
    bodyAreas: [],
    dailyImpact: 'disruptive',
    triedRemedies: ['none'],
    priorVisit: null,
    sameSymptoms: false,
    visibility: 'public',
  },
]

export const demoQuestions: Question[] = seeds.map(toQuestion)

export const demoAnswers: Answer[] = [
  {
    id: 'a-nose-1',
    questionId: 'q-nose',
    doctorId: 'doc-han-ent',
    body:
      '2주 넘게 이어지는 코막힘은 단순 감기보다 비염이나 부비동 문제를 함께 봅니다. 밤에 어느 쪽 코가 더 막히는지 확인해 보세요. 진료가 필요하면 프로필에서 이어가실 수 있습니다.',
    createdAt: '2026-08-08T12:00:00.000Z',
  },
  {
    id: 'a-nose-2',
    questionId: 'q-nose',
    doctorId: 'doc-forest-fm',
    body: '약국 약으로 2주 이상 변화가 없으면 한 번은 진료로 확인하시는 편이 낫습니다.',
    createdAt: '2026-08-08T15:30:00.000Z',
  },
  {
    id: 'a-rash-1',
    questionId: 'q-rash',
    doctorId: 'doc-skin-derm',
    body:
      '저녁에만 반복되는 양상이면 하루 중 시간과 먹은 것, 입은 옷을 2주간 같이 기록해 보시면 좁혀지는 경우가 있습니다.',
    createdAt: '2026-07-26T09:00:00.000Z',
  },
  {
    id: 'a-rash-2',
    questionId: 'q-rash',
    doctorId: 'doc-forest-im',
    body: '피부만 보지 말고 갑상선이나 다른 전신 원인도 한 번은 확인해 볼 수 있습니다.',
    createdAt: '2026-07-27T10:10:00.000Z',
  },
  {
    id: 'a-sleep-1',
    questionId: 'q-sleep',
    doctorId: 'doc-inha-psy',
    body: '잠들기까지 걸린 시간과 깬 횟수를 2주만 적어 오시면 이야기가 훨씬 빨라집니다.',
    createdAt: '2026-08-06T09:20:00.000Z',
  },
]

/** at 값이 주간 창(2026-08-03~09) 안팎에 걸치도록 일부러 배치했다. */
function seedEmpathy(questionId: string, count: number, at: string, offset = 0): Empathy[] {
  return Array.from({ length: count }, (_, index) => ({
    questionId,
    patientId: `pat-seed-${questionId}-${offset + index}`,
    at,
  }))
}

export const demoEmpathies: Empathy[] = [
  ...seedEmpathy('q-rash', 5, '2026-08-06T10:00:00.000Z'),
  ...seedEmpathy('q-rash', 4, '2026-07-26T10:00:00.000Z', 100),
  ...seedEmpathy('q-sleep', 4, '2026-08-07T21:00:00.000Z'),
  ...seedEmpathy('q-nose', 3, '2026-08-08T18:00:00.000Z'),
  ...seedEmpathy('q-chest', 2, '2026-08-09T08:00:00.000Z'),
  ...seedEmpathy('q-stomach', 6, '2026-08-08T09:00:00.000Z'),
]

export function findQuestion(questions: Question[], questionId: string): Question | undefined {
  return questions.find((question) => question.id === questionId)
}

export function findPatient(patientId: string): Patient | undefined {
  return demoPatients.find((patient) => patient.id === patientId)
}
