import { QuestionCard } from '../../components/QuestionCard'
import { demoWeekEndingOn } from '../../data/demoCalendar'
import { boardRuleSet } from '../../data/rules/boardRules'
import { empathyCount, hasEmpathized, orderBoard, rankWeeklyHot } from '../../domain/board'
import { useCommunity } from '../../state/CommunityContext'

export function BoardScreen() {
  const { state, toggleQuestionEmpathy } = useCommunity()

  const ranks = rankWeeklyHot(state.questions, state.empathies, boardRuleSet, demoWeekEndingOn)
  const ordered = orderBoard(state.questions, ranks)

  return (
    <div className="screen">
      <h1>자유게시판</h1>
      <p className="screen-lead">
        공개로 올린 질문이 모입니다. 한 주 동안 공감이 많이 모인 글은 위로 올라가 여러 과의 의사
        눈에 걸립니다.
      </p>

      <div className="card-list">
        {ordered.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            answerCount={state.answers.filter((a) => a.questionId === question.id).length}
            empathyCount={empathyCount(state.empathies, question.id)}
            empathized={hasEmpathized(state.empathies, question.id, state.patientId)}
            isHot={ranks.find((rank) => rank.questionId === question.id)?.isHot ?? false}
            onToggleEmpathy={toggleQuestionEmpathy}
          />
        ))}
      </div>

      <p className="clinical-caveat">
        정렬 규칙 {boardRuleSet.name} · 기준일 {boardRuleSet.asOf} · 최근 {boardRuleSet.windowDays}일
        공감 {boardRuleSet.minWeeklyCount}개 이상, 최대 {boardRuleSet.hotLimit}개 고정
      </p>
    </div>
  )
}
