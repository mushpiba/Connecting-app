import { useNavigate } from 'react-router-dom'
import { InstallCard } from '../../components/InstallCard'
import { QuestionCard } from '../../components/QuestionCard'
import { boardRuleSet } from '../../data/rules/boardRules'
import { demoWeekEndingOn } from '../../data/demoCalendar'
import { empathyCount, hasEmpathized, orderBoard, rankWeeklyHot } from '../../domain/board'
import { useCommunity } from '../../state/CommunityContext'

export function HomeScreen() {
  const { state, toggleQuestionEmpathy } = useCommunity()
  const navigate = useNavigate()

  const ranks = rankWeeklyHot(state.questions, state.empathies, boardRuleSet, demoWeekEndingOn)
  const hot = orderBoard(state.questions, ranks).filter(
    (question) => ranks.find((rank) => rank.questionId === question.id)?.isHot,
  )
  const mine = state.questions.filter((question) => question.patientId === state.patientId)

  return (
    <div className="screen">
      <InstallCard />

      <section className="hero" aria-labelledby="home-hero-heading">
        <p className="eyebrow">SYMPTOM TO CARE · DEMO</p>
        <h1 id="home-hero-heading">어디가 불편하신가요</h1>
        <p className="hero-lead">
          증상을 적어 주시면 어느 과로 가면 좋을지 정리해 드리고, 답변한 의사에게서 바로 진료로
          이어갈 수 있습니다.
        </p>
        <button type="button" className="primary-cta" onClick={() => navigate('/ask')}>
          증상 적어보기 <span aria-hidden="true">›</span>
        </button>
      </section>

      <section aria-labelledby="home-hot-heading">
        <h2 id="home-hot-heading">이번 주 많이 공감한 글</h2>
        {hot.length === 0 ? (
          <p className="empty-note">이번 주에는 아직 상단에 고정된 글이 없습니다.</p>
        ) : (
          <div className="card-list">
            {hot.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                answerCount={state.answers.filter((a) => a.questionId === question.id).length}
                empathyCount={empathyCount(state.empathies, question.id)}
                empathized={hasEmpathized(state.empathies, question.id, state.patientId)}
                isHot
                onToggleEmpathy={toggleQuestionEmpathy}
              />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="home-mine-heading">
        <h2 id="home-mine-heading">내 질문</h2>
        {mine.length === 0 ? (
          <p className="empty-note">아직 올린 질문이 없습니다.</p>
        ) : (
          <div className="card-list">
            {mine.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                answerCount={state.answers.filter((a) => a.questionId === question.id).length}
                empathyCount={empathyCount(state.empathies, question.id)}
                empathized={hasEmpathized(state.empathies, question.id, state.patientId)}
                isHot={false}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
