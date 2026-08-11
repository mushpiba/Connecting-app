import { useNavigate } from 'react-router-dom'
import { AppIcon } from '../../components/AppIcon'
import { InstallCard } from '../../components/InstallCard'
import { demoToday } from '../../data/demoCalendar'
import { carePrepProgress } from '../../domain/carePrep'
import { useCommunity } from '../../state/CommunityContext'
import { usePatientSettings } from '../../state/PatientSettingsContext'
import { groupMyActivity } from './activity'
import { resolveNextStep } from './nextStep'

const stepEyebrow: Record<string, string> = {
  'first-visit': '시작하기',
  waiting: '진행 중',
  answered: '새 답변',
  booked: '예약 진행 중',
}

export function HomeScreen() {
  const { state } = useCommunity()
  const { settings } = usePatientSettings()
  const navigate = useNavigate()

  const step = resolveNextStep(
    state.questions,
    state.answers,
    state.bookings,
    state.patientId,
    demoToday,
  )
  const prep = carePrepProgress(state.precheck, settings.address.detail.trim() !== '')
  const activity = groupMyActivity(state.questions, state.answers, state.patientId).slice(0, 3)

  return (
    <div className="screen">
      {/* 홈은 읽을거리가 아니라 내 건이 어디까지 왔는지다. 지금 할 일 하나만 크게. */}
      <section className={`next-step is-${step.kind}`} aria-labelledby="next-step-heading">
        <p className="eyebrow">{stepEyebrow[step.kind]}</p>
        <h1 id="next-step-heading">{step.title}</h1>
        <p className="next-step-detail">{step.detail}</p>
        <button
          type="button"
          className="primary-cta"
          onClick={() => navigate(step.actionPath)}
        >
          {step.actionLabel} <span aria-hidden="true">›</span>
        </button>
      </section>

      {!prep.complete && (
        <button
          type="button"
          className="prep-nudge"
          onClick={() => navigate('/me/precheck')}
        >
          <span className="prep-nudge-text">
            <strong>비대면 진료 준비 {prep.doneCount} / {prep.total}</strong>
            <span>남은 항목을 채우면 답변한 의사에게 바로 신청할 수 있어요</span>
          </span>
          <span className="prep-bar" aria-hidden="true">
            <span style={{ width: `${prep.percent}%` }} />
          </span>
        </button>
      )}

      <section aria-labelledby="home-activity-heading">
        <h2 id="home-activity-heading">최근 내 활동</h2>
        {activity.length === 0 ? (
          <div className="empty-state">
            <h2>아직 남긴 사연이 없어요</h2>
            <p>증상을 적으면 진행 상황을 여기에서 확인할 수 있습니다.</p>
            <div className="empty-state-actions">
              <button type="button" className="primary-cta" onClick={() => navigate('/ask')}>
                증상 적어보기
              </button>
            </div>
          </div>
        ) : (
          <div className="list-card">
            {activity.map((item) => (
              <button
                key={item.question.id}
                type="button"
                className="list-row"
                onClick={() => navigate(`/questions/${item.question.id}`)}
              >
                <span className={`row-tag ${item.hasAnswer ? 'is-answer' : 'is-question'}`}>
                  {item.hasAnswer ? `새 답변 ${item.answerCount}` : '답변 대기'}
                </span>
                <span className="row-title">{item.question.title}</span>
                <time dateTime={item.latestAt}>{item.latestAt.slice(0, 10)}</time>
                <span className="row-chevron" aria-hidden="true">›</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="home-quick-heading">
        <h2 id="home-quick-heading">바로 가기</h2>
        <div className="list-card">
          <button type="button" className="list-row" onClick={() => navigate('/map')}>
            <AppIcon name="map" />
            <span className="row-title">내 주변 병원</span>
            <span className="row-note">비대면 가능 지역 확인</span>
            <span className="row-chevron" aria-hidden="true">›</span>
          </button>
          <button type="button" className="list-row" onClick={() => navigate('/me/appointments')}>
            <AppIcon name="calendar" />
            <span className="row-title">예약 내역</span>
            <span className="row-note">전달한 희망 시간</span>
            <span className="row-chevron" aria-hidden="true">›</span>
          </button>
          <button type="button" className="list-row" onClick={() => navigate('/news')}>
            <AppIcon name="news" />
            <span className="row-title">내소식</span>
            <span className="row-note">사연과 답변</span>
            <span className="row-chevron" aria-hidden="true">›</span>
          </button>
        </div>
      </section>

      <section className="care-prep-card" aria-labelledby="care-prep-heading">
        <p className="eyebrow">BEFORE YOUR VISIT</p>
        <h2 id="care-prep-heading">진료 준비</h2>
        <p>진료 전에 아래 세 가지를 메모해 두면 증상을 더 정확하게 설명할 수 있습니다.</p>
        <ul>
          <li>증상이 시작된 날과 달라진 과정</li>
          <li>현재 복용 중인 약 이름</li>
          <li>의사에게 꼭 묻고 싶은 내용</li>
        </ul>
      </section>

      <InstallCard />
    </div>
  )
}
