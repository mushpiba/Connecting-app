import { nowIso, todayIso } from '../../data/appClock'
import { useNavigate } from 'react-router-dom'
import { DoctorPortrait } from '../../components/DoctorPortrait'
import { clinicScheduleOn, weekdayLabels } from '../../domain/clinicHours'
import { directRequests, keywordFeed, notificationDigest } from '../../domain/doctorFeed'
import { privateThreadRuleSet } from '../../data/rules/privateThreadRules'
import { awaitingDoctorReply } from '../../domain/privateThread'
import { useCommunity } from '../../state/CommunityContext'
import { useDirectory } from '../../state/directory'
import { useDoctorSettings } from '../../state/DoctorSettingsContext'

export function DoctorHomeScreen() {
  const { state } = useCommunity()
  const { doctors, findDoctor, findClinic } = useDirectory()
  const { settingsOf } = useDoctorSettings()
  const navigate = useNavigate()

  const doctor = findDoctor(state.doctorId) ?? doctors[0]
  const clinic = findClinic(doctor.clinicId)
  const settings = settingsOf(doctor.id, doctor.templateId)

  const direct = directRequests(doctor, state.questions, state.bookings)
  const feed = keywordFeed(doctor, settings, state.questions)
  const digest = notificationDigest(feed, settings.dailyNotificationLimit)

  const answeredIds = new Set(
    state.answers.filter((answer) => answer.doctorId === doctor.id).map((a) => a.questionId),
  )
  const waiting = [...direct.questions, ...feed.map((item) => item.question)].filter(
    (question) => !answeredIds.has(question.id),
  )
  const schedule = clinic ? clinicScheduleOn(clinic, todayIso()) : null
  const pendingEncounters = state.encounters.filter(
    (item) => item.doctorId === doctor.id && item.status === 'requested',
  )
  /*
    Q-9 — 「환자가 이미 연 대화 중 내 회신 차례인 것」만 센다. 상한을 다 쓴
    대화는 세지 않는다.

    **이 줄을 「말 걸 수 있는 환자 목록」으로 자라게 하지 않는다.** 그 순간 의사
    쪽 영업 경로가 되고 D-6 항목 1이 구조에서 문구로 내려앉는다. 대화를
    시작하는 버튼은 여기에도, 의사 화면 어디에도 없다.
  */
  const awaiting = awaitingDoctorReply(
    state.privateThreads,
    state.privateMessages,
    doctor.id,
    privateThreadRuleSet,
  )

  return (
    <div className="screen">
      <section className="doctor-hero" aria-labelledby="doctor-hero-heading">
        <DoctorPortrait doctor={doctor} size={56} />
        <div>
          <h1 id="doctor-hero-heading">{doctor.name}</h1>
          <p>
            {clinic?.name}
            {schedule &&
              ` · ${
                schedule.isOpenToday
                  ? `오늘 ${schedule.today.open}–${schedule.today.close}`
                  : `오늘 휴진${
                      schedule.nextOpen
                        ? ` · 다음 ${weekdayLabels[schedule.nextOpen.weekday]}요일`
                        : ''
                    }`
              }`}
          </p>
        </div>
      </section>

      {!doctor.licenseVerified && (
        <p className="gate-reason">
          면허 검증을 마쳐야 질문이 전달되고 답변을 쓸 수 있습니다.
        </p>
      )}

      {/*
        진료 신청은 사연과 성격이 다르다. 저쪽에서 사람이 기다리고 있으므로
        목록 안에 섞지 않고 맨 위에 세운다.
      */}
      {pendingEncounters.length > 0 && (
        <button
          type="button"
          className="encounter-alert"
          onClick={() => navigate('/doctor/visits')}
        >
          <strong>비대면 진료 신청 {pendingEncounters.length}건</strong>
          <span>환자가 진료방을 기다리고 있습니다. 눌러서 여세요.</span>
        </button>
      )}

      {/*
        진료 신청 알림 아래, 숫자 3개 위. /doctor/inbox 에 두지 않는 이유는
        상한이다 — 그 화면 상단은 잔여 답변 5회가 차지하는데 회신은 그 5회를
        소모하지 않는다. 소모하는 숫자와 소모하지 않는 숫자를 나란히 두면
        의사는 회신을 아끼게 되고, 그건 D-8이 막으려던 결과다.
      */}
      {awaiting.length > 0 && (
        <button
          type="button"
          className="private-waiting-line"
          onClick={() => navigate(`/doctor/questions/${awaiting[0].thread.questionId}`)}
        >
          <strong>비공개 회신 대기 {awaiting.length}건</strong>
          <span>
            환자가 답변에 이어 물었습니다. 오래 기다린 것부터 보여 줍니다.
          </span>
        </button>
      )}

      <div className="doctor-stats">
        <button type="button" onClick={() => navigate('/doctor/inbox')}>
          <strong>{direct.questions.length}</strong>
          <span>나를 지목한 사연</span>
        </button>
        <button type="button" onClick={() => navigate('/doctor/stories')}>
          <strong>{feed.length}</strong>
          <span>내 과·키워드</span>
        </button>
        <button type="button" onClick={() => navigate('/doctor/visits')}>
          <strong>{direct.bookings.length}</strong>
          <span>받은 예약</span>
        </button>
      </div>

      <section aria-labelledby="doctor-waiting-heading">
        <h2 id="doctor-waiting-heading">답변을 기다리는 사연</h2>
        {waiting.length === 0 ? (
          <div className="empty-state">
            <h2>지금은 기다리는 사연이 없어요</h2>
            <p>새 사연이 올라오면 알림 설정에 따라 여기에 쌓입니다.</p>
          </div>
        ) : (
          <div className="list-card">
            {waiting.slice(0, 5).map((question) => (
              <button
                key={question.id}
                type="button"
                className="list-row"
                onClick={() => navigate(`/doctor/questions/${question.id}`)}
              >
                <span className="row-tag is-question">
                  {question.visibility === 'prior-clinic-only' ? '지목' : '매칭'}
                </span>
                <span className="row-title">{question.title}</span>
                <span className="row-chevron" aria-hidden="true">›</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 알림이 쏟아지면 의사는 알림을 꺼 버리고 급한 것도 놓친다. */}
      <button type="button" className="prep-nudge" onClick={() => navigate('/doctor/me/keywords')}>
        <span className="prep-nudge-text">
          <strong>
            오늘 알림 {digest.sent.length} / {digest.limit}
          </strong>
          <span>
            {digest.heldBack > 0
              ? `상한을 넘겨 ${digest.heldBack}건은 알리지 않았습니다. 사연 모음에서 볼 수 있어요.`
              : '키워드와 알림 상한을 바꾸면 여기에 오는 사연이 달라집니다.'}
          </span>
        </span>
      </button>
    </div>
  )
}
