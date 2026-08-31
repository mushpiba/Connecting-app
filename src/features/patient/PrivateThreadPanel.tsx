import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PrivateMessageList } from '../../components/PrivateMessageList'
import { privateThreadRuleSet } from '../../data/rules/privateThreadRules'
import { maxCharsFor, messagesOf, privateThreadStage, threadForAnswer } from '../../domain/privateThread'
import type { Answer, Doctor } from '../../domain/types'
import { useCommunity } from '../../state/CommunityContext'

interface PrivateThreadPanelProps {
  answer: Answer
  doctor: Doctor
}

const rules = privateThreadRuleSet

/**
 * 답변 카드 아래에 붙는 비공개 덧붙임 (G-5 · D-6).
 *
 * **각 답변 카드 아래**에 있는 것이 항목 2를 화면으로 옮긴 것이다. 답변이 없는
 * 의사에게는 붙을 카드가 없으므로 비공개 경로도 없다. 「의사에게 문의」 같은
 * 별도 진입로를 만들지 않는 이유가 여기 있다 — 그 순간 공개 기여 없이 개별
 * 접촉하는 경로가 생긴다.
 *
 * 이 자리는 **글쓴이에게만** 그려진다. 남의 사연을 읽는 사람에게는 대화의 존재
 * 자체가 보이지 않고, 서버도 같다(`private_threads` SELECT 정책).
 */
export function PrivateThreadPanel({ answer, doctor }: PrivateThreadPanelProps) {
  const { state, openPrivateThread, sendPrivateMessage } = useCommunity()
  const navigate = useNavigate()
  const [body, setBody] = useState('')

  const thread = threadForAnswer(state.privateThreads, answer.id, state.patientId)
  const messages = thread ? messagesOf(state.privateMessages, thread.id) : []
  const stage = privateThreadStage(messages, rules)
  const maxChars = maxCharsFor('patient', rules)

  /** 한 단계 경유는 여기서도 유지된다 — 예약·신청으로 바로 보내지 않는다. */
  const escalate = () => navigate(`/doctors/${doctor.id}`)

  const send = (threadId: string) => (event: React.FormEvent) => {
    event.preventDefault()
    sendPrivateMessage(threadId, 'patient', body.trim())
    setBody('')
  }

  if (!thread) {
    return (
      <section className="private-thread is-closed" aria-label={`${doctor.name} 의사에게 비공개로 묻기`}>
        <p className="private-thread-lead">
          {doctor.name} 의사에게 이 답변에 대해 비공개로 더 물어볼 수 있습니다. 주고받은 내용은 두
          사람에게만 보입니다.
        </p>
        <p className="private-thread-limits">
          남은 왕복 {rules.limits.maxRounds}회 · 한 번에 {maxChars}자까지
        </p>
        <button
          type="button"
          className="secondary-button"
          onClick={() => void openPrivateThread(answer.questionId, answer.id, doctor.id)}
        >
          비공개로 더 묻기
        </button>
      </section>
    )
  }

  return (
    <section className="private-thread is-open" aria-label={`${doctor.name} 의사와의 비공개 덧붙임`}>
      {/* 열자마자 경계를 적는다. 막는다고 적고 안 막으면 원칙 6 위반이지만,
          막으면서 안 적으면 의사도 환자도 왜 안 되는지 모른다. */}
      <p className="private-thread-boundary">
        여기는 진료가 아닙니다. 처방·진단·검사 지시는 오갈 수 없고, 그런 표현은 보내지지 않습니다.
        진료가 필요하면 아래 버튼으로 넘어가세요.
      </p>

      <PrivateMessageList messages={messages} doctorName={doctor.name} viewerRole="patient" />

      <p className="private-thread-limits">
        남은 왕복 {stage.roundsLeft}회 · 한 번에 {maxChars}자까지
      </p>

      {/* 상한에 닿으면 입력 칸이 **사라진다.** 비활성으로 두면 왜 안 되는지
          모르고, 상한을 다 쓴 것은 막힘이 아니라 완결이다. */}
      {stage.exhausted ? (
        <p className="private-thread-closed-note">
          비공개로 주고받을 수 있는 {rules.limits.maxRounds}왕복을 다 썼습니다. 더 필요한 이야기는
          진료에서 하는 것이 맞습니다.
        </p>
      ) : stage.turn === 'patient' ? (
        <form className="private-thread-form" onSubmit={send(thread.id)}>
          <label htmlFor={`private-body-${answer.id}`}>비공개로 묻기</label>
          <textarea
            id={`private-body-${answer.id}`}
            rows={3}
            value={body}
            maxLength={maxChars}
            placeholder="예) 알려주신 방법을 2주 해봤는데 그대로면 어떻게 하나요?"
            onChange={(event) => setBody(event.target.value)}
          />
          {/* 넘으면 더 입력되지 않는다. 잘라내지 않는다 — 다 쓰고 나서 뒤가
              사라지면 그건 데이터 손실이다. */}
          <p className="field-hint">{maxChars - body.length}자 남았습니다</p>
          <button type="submit" className="primary-cta" disabled={body.trim().length < 2}>
            보내기
          </button>
          <p className="clinical-caveat">
            비공개 대화도 서버에 저장됩니다. 두 사람 외에는 볼 수 없습니다. 보낸 뒤에는 취소할 수
            없습니다.
          </p>
        </form>
      ) : (
        <p className="private-thread-closed-note">
          의사 회신을 기다리는 중입니다. 회신이 오면 한 번 더 물을 수 있습니다.
        </p>
      )}

      {/* 대화 영역 하단 고정. 스크롤해도 사라지지 않고, 상한을 다 쓴 뒤에는
          이것만 남는다 (D-6 항목 6). */}
      <button type="button" className="private-thread-escalate" onClick={escalate}>
        진료가 필요합니다
      </button>
    </section>
  )
}
