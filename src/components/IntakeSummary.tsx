import type {
  BodyArea,
  DailyImpact,
  Question,
  SymptomCourse,
  TriedRemedy,
} from '../domain/types'

const courseLabels: Record<SymptomCourse, string> = {
  worsening: '점점 심해짐',
  unchanged: '그대로',
  fluctuating: '좋았다 나빴다',
  improving: '좋아지는 중',
}

const impactLabels: Record<DailyImpact, string> = {
  none: '거의 없음',
  mild: '조금 불편함',
  disruptive: '일상에 지장 있음',
  severe: '잠을 못 잘 정도',
}

const remedyLabels: Record<TriedRemedy, string> = {
  otc: '약국 약',
  clinic: '병원 진료',
  rest: '찜질·휴식',
  none: '아무것도 안 함',
}

const areaLabels: Record<BodyArea, string> = {
  ent: '코·목·귀',
  eye: '눈',
  skin: '피부',
  digestive: '배·소화',
  musculoskeletal: '허리·관절·근육',
  mind: '마음·수면',
  urinary: '소변',
  womens: '여성 건강',
  child: '아이 문제',
  general: '감기·몸살·전반',
  unsure: '잘 모르겠음',
}

interface IntakeSummaryProps {
  question: Question
  durationDays: number
}

/**
 * 환자가 문진 양식에서 답한 내용을 그대로 보여준다.
 * 의사가 답변을 쓸지 정하기 전에 읽는 정보이자, 환자가 무엇을 냈는지 확인하는 화면이다.
 */
export function IntakeSummary({ question, durationDays }: IntakeSummaryProps) {
  return (
    <dl className="intake-summary">
      <div>
        <dt>기간</dt>
        <dd>
          {durationDays}일째 · {question.onsetDate} 시작
        </dd>
      </div>
      <div>
        <dt>경과</dt>
        <dd>{courseLabels[question.course]}</dd>
      </div>
      <div>
        <dt>일상 지장</dt>
        <dd>{impactLabels[question.dailyImpact]}</dd>
      </div>
      {question.bodyAreas.length > 0 && (
        <div>
          <dt>불편한 곳</dt>
          <dd>{question.bodyAreas.map((area) => areaLabels[area]).join(', ')}</dd>
        </div>
      )}
      {question.triedRemedies.length > 0 && (
        <div>
          <dt>해본 것</dt>
          <dd>{question.triedRemedies.map((item) => remedyLabels[item]).join(', ')}</dd>
        </div>
      )}
    </dl>
  )
}
