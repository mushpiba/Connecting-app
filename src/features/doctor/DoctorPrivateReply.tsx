import { nowIso } from '../../data/appClock'
import { useState } from 'react'
import { ExpressionFilterNotice } from '../../components/ExpressionFilterNotice'
import { PrivateMessageList } from '../../components/PrivateMessageList'
import { privateThreadRuleSet } from '../../data/rules/privateThreadRules'
import {
  findExpressionHits,
  maxCharsFor,
  messagesOf,
  privateThreadStage,
  toFilterHitRecords,
} from '../../domain/privateThread'
import type { ExpressionHit } from '../../domain/privateThread'
import type { Doctor, PrivateThread } from '../../domain/types'
import { useCommunity } from '../../state/CommunityContext'

interface DoctorPrivateReplyProps {
  thread: PrivateThread
  doctor: Doctor
}

const rules = privateThreadRuleSet

/**
 * 의사 쪽 비공개 회신 칸. 공개 답변 폼 아래에 붙는다.
 *
 * **이 화면에 대화를 여는 수단이 없다.** 환자가 열지 않은 답변 아래에는 이
 * 구역 자체가 그려지지 않는다 — 비활성 버튼이 아니라 **없는 자리**다.
 * 「비공개로 말 걸기」는 의사 화면 어디에도 없고 서버에도 의사용 INSERT 정책이
 * 없다 (D-6 항목 1).
 *
 * 회신은 **하루 답변 상한(D-8)을 차감하지 않는다.** 새 노출이 아니라 이미 한
 * 답변의 연장이고, 세면 의사가 답변을 아끼느라 회신을 안 하게 된다.
 */
export function DoctorPrivateReply({ thread, doctor }: DoctorPrivateReplyProps) {
  const { state, sendPrivateMessage, logExpressionHits } = useCommunity()
  const [body, setBody] = useState('')
  const [hits, setHits] = useState<ExpressionHit[]>([])

  const messages = messagesOf(state.privateMessages, thread.id)
  const stage = privateThreadStage(messages, rules)
  const maxChars = maxCharsFor('doctor', rules)

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = body.trim()
    if (!trimmed) return

    // 걸리면 전송하지 않는다. 경고만 하고 보내면 화면이 아무것도 막지 않으면서
    // 막는다고 적는 것이 되고, 그건 원칙 6 위반이다.
    const found = findExpressionHits(trimmed, rules)
    if (found.length > 0) {
      setHits(found)
      logExpressionHits(
        toFilterHitRecords(found, doctor.id, 'private-message', { threadId: thread.id }, rules, nowIso()),
      )
      return
    }

    setHits([])
    sendPrivateMessage(thread.id, 'doctor', trimmed)
    setBody('')
  }

  return (
    <section className="private-thread is-open" aria-labelledby="doctor-private-heading">
      <h2 id="doctor-private-heading">비공개 덧붙임</h2>
      <p className="private-thread-lead">
        환자가 이 답변에 대해 비공개로 물었습니다. 두 사람에게만 보입니다.
      </p>
      <p className="sort-note">주고받은 순서대로 보여 줍니다.</p>

      <PrivateMessageList messages={messages} doctorName={doctor.name} viewerRole="doctor" />

      <p className="private-thread-limits">
        남은 왕복 {stage.roundsLeft}회 · 한 번에 {maxChars}자까지
      </p>

      {stage.exhausted ? (
        <p className="private-thread-closed-note">
          이 대화의 {rules.limits.maxRounds}왕복이 끝났습니다. 더 필요한 이야기는 진료에서 하는 것이
          맞습니다.
        </p>
      ) : stage.turn === 'doctor' ? (
        <form className="private-thread-form" onSubmit={submit}>
          <label htmlFor="doctor-private-body">비공개 회신</label>
          <p className="field-hint">
            처방·진단 단정·검사 지시로 읽히는 표현은 보내지지 않습니다. 필요하면 진료를 권해 주세요.
          </p>
          <textarea
            id="doctor-private-body"
            rows={4}
            value={body}
            maxLength={maxChars}
            onChange={(event) => setBody(event.target.value)}
          />
          <p className="field-hint">{maxChars - body.length}자 남았습니다</p>
          <ExpressionFilterNotice hits={hits} />
          <button type="submit" className="primary-cta" disabled={body.trim().length < 2}>
            회신 등록
          </button>
          {/*
            고정 고지는 이 입력 칸에 없다. 회신 말풍선이 스스로 달고 나간다 —
            미리 채워 두면 지울 수 있게 되고 그러면 「의사가 못 지운다」가
            거짓이 된다. 400자 상한에도 넣지 않는다.
          */}
          <p className="clinical-caveat">
            등록하면 고정 고지가 함께 붙어 나갑니다. 지울 수 없고 글자 수에도 세지 않습니다. 보낸
            뒤에는 취소할 수 없습니다.
          </p>
        </form>
      ) : (
        <p className="private-thread-closed-note">환자가 다시 물으면 회신할 수 있습니다.</p>
      )}
    </section>
  )
}
