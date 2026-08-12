import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { triageRuleSet } from '../../data/rules/triageRules'
import {
  consultRedFlags,
  extractConsultKeywords,
  transcriptToRecordDraft,
} from '../../domain/consultation'
import { isLiveMode } from '../../data/supabaseClient'
import { useCommunity } from '../../state/CommunityContext'
import { useConsultRoom } from './useConsultRoom'
import { useSpeechTranscript } from './useSpeechTranscript'

interface ConsultScreenProps {
  role: 'patient' | 'doctor'
}

/**
 * 화상 진료방.
 *
 * 의사가 부르는 쪽이다. 환자가 먼저 들어와 기다리고 의사가 제안을 보낸다.
 * 진료를 여는 사람이 의사이기 때문이고, 그래야 환자가 빈 방에서 기다리지 않는다.
 */
export function ConsultScreen({ role }: ConsultScreenProps) {
  const { roomId = '' } = useParams()
  const navigate = useNavigate()
  const { state, live } = useCommunity()
  const [consented, setConsented] = useState(false)
  const [copied, setCopied] = useState(false)
  const [manual, setManual] = useState('')

  /*
   * 이 방에 들어갈 자격.
   *
   * 방 주소만 알면 아무나 들어올 수 있었다. 진료 통화에서는 그게 그냥 도청이다.
   * encounters 는 RLS 가 당사자에게만 보여주므로, 내 목록에 그 방이 없다는 것은
   * 내가 당사자가 아니라는 뜻이다. 화면에서 가리는 것이 아니라 서버가 판단한다.
   *
   * demo- 로 시작하는 방은 신청 없이 여는 시연용이라 그대로 연다.
   */
  const isDemoRoom = roomId.startsWith('demo-')
  const encounter = state.encounters.find((item) => item.id === roomId)
  // 아직 서버에서 읽기 전이면 아직 모르는 것이다. 모르는 것을 거절로 바꾸지 않는다.
  const checking = isLiveMode && live === null
  const allowed = isDemoRoom || encounter !== undefined

  const room = useConsultRoom(roomId, role === 'doctor')
  const speech = useSpeechTranscript(role, room.publishLine)

  const localRef = useRef<HTMLVideoElement>(null)
  const remoteRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (localRef.current) localRef.current.srcObject = room.localStream
  }, [room.localStream])

  useEffect(() => {
    if (remoteRef.current) remoteRef.current.srcObject = room.remoteStream
  }, [room.remoteStream])

  /*
   * 상대가 끊거나 연결이 실패해도 마이크는 닫혀야 한다. 종료 버튼에만 걸어 두면
   * 내가 누르지 않은 종료에서 계속 듣고 있게 된다.
   */
  useEffect(() => {
    if (room.status === 'ended') speech.stop()
  }, [room.status, speech])

  const keywords = extractConsultKeywords(room.transcript, triageRuleSet)
  const redFlags = consultRedFlags(room.transcript, triageRuleSet)

  const statusLabel: Record<typeof room.status, string> = {
    idle: '아직 들어가지 않았습니다',
    joining: '연결하는 중…',
    waiting: role === 'doctor' ? '환자를 기다리는 중' : '의사를 기다리는 중',
    connected: '연결됨',
    ended: '통화가 끝났습니다',
    unsupported: '이 브라우저에서는 화상 진료를 열 수 없습니다',
  }

  if (checking) {
    return (
      <div className="screen">
        <p className="empty-note">진료방을 확인하는 중입니다…</p>
      </div>
    )
  }

  if (!allowed) {
    return (
      <div className="screen">
        <h1>이 진료방에 들어갈 수 없습니다</h1>
        <p className="gate-reason">
          이 방은 신청한 환자와 담당 의사만 들어갈 수 있습니다. 주소를 받았더라도 당사자가
          아니면 열리지 않습니다.
        </p>
        <button type="button" className="secondary-button" onClick={() => navigate(-1)}>
          돌아가기
        </button>
      </div>
    )
  }

  /* 녹음과 전사는 동의를 받고 시작한다. 동의 없이 받아 적으면 안 된다. */
  if (!consented) {
    return (
      <div className="screen">
        <h1>화상 진료 시작 전에</h1>
        <section className="consent-card">
          <h2>통화 내용을 글로 받아 적습니다</h2>
          <ul>
            <li>내 마이크에 들어온 말만 내 기기에서 글로 바꿔 상대에게 보냅니다.</li>
            <li>영상과 음성은 두 사람의 브라우저 사이로 직접 흐릅니다.</li>
            <li>받아 적은 글은 진료 기록 초안을 만드는 데 쓰입니다.</li>
          </ul>

          <p className="gate-reason">
            지금은 브라우저 내장 받아쓰기를 씁니다. 이 기능은 음성을 브라우저 제조사 서버로
            보냅니다. 그래서 이 데모에는 실제 증상이나 개인정보를 말하지 마세요. 실서비스에서는
            기기 안에서만 도는 받아쓰기로 바꿔야 합니다.
          </p>

          <div className="step-actions">
            <button type="button" className="secondary-button" onClick={() => navigate(-1)}>
              돌아가기
            </button>
            <button type="button" className="primary-cta" onClick={() => setConsented(true)}>
              동의하고 들어가기
            </button>
          </div>
        </section>

        <p className="clinical-caveat">
          가상 데이터로 만든 시연입니다. 실제 진료가 아니며 통화 내용은 어디에도 저장되지 않습니다.
        </p>
      </div>
    )
  }

  return (
    <div className="screen consult-screen">
      <div className="consult-topbar">
        <h1>화상 진료</h1>
        <span className={`consult-status is-${room.status}`}>{statusLabel[room.status]}</span>
      </div>

      <div className="video-stage">
        <video ref={remoteRef} autoPlay playsInline className="video-remote" />
        <video ref={localRef} autoPlay playsInline muted className="video-local" />
        {room.status !== 'connected' && (
          <p className="video-placeholder">{statusLabel[room.status]}</p>
        )}
      </div>

      {room.error && <p className="gate-reason">{room.error}</p>}

      <div className="consult-actions">
        {room.status === 'idle' || room.status === 'ended' ? (
          <button type="button" className="primary-cta" onClick={() => void room.join()}>
            진료방 들어가기
          </button>
        ) : (
          <button
            type="button"
            className="danger-button"
            onClick={() => {
              // 통화가 끝났는데 마이크가 계속 열려 있었다. 의료 상담에서 이건
              // 기능 문제가 아니라 사람이 모르는 채로 녹음되는 문제다.
              speech.stop()
              room.leave()
            }}
          >
            통화 종료
          </button>
        )}

        {speech.listening ? (
          <button type="button" className="secondary-button" onClick={speech.stop}>
            받아쓰기 멈춤
          </button>
        ) : (
          <button
            type="button"
            className="secondary-button"
            disabled={!speech.supported}
            onClick={speech.start}
          >
            받아쓰기 시작
          </button>
        )}
      </div>

      {speech.error && <p className="gate-reason">{speech.error}</p>}
      {speech.listening && (
        <p className="speech-state">
          <span aria-hidden="true">●</span> 듣는 중
          {speech.lastEvent && ` · ${speech.lastEvent}`}
        </p>
      )}
      {!speech.supported && (
        <p className="gate-reason">
          이 브라우저는 받아쓰기를 지원하지 않습니다. Chrome에서 열어 주세요.
        </p>
      )}

      <section className="transcript-panel" aria-labelledby="transcript-heading">
        <h2 id="transcript-heading">통화 기록</h2>
        {room.transcript.length === 0 ? (
          <p className="empty-note">받아쓰기를 켜면 오간 말이 여기에 쌓입니다.</p>
        ) : (
          <ol className="transcript-list">
            {room.transcript.map((line) => (
              <li key={line.id} className={`is-${line.speaker}`}>
                <span className="transcript-speaker">
                  {line.speaker === 'doctor' ? '의사' : '환자'}
                </span>
                <span className="transcript-text">{line.text}</span>
              </li>
            ))}
          </ol>
        )}
        {speech.interim && <p className="transcript-interim">{speech.interim}…</p>}

        {/* 받아쓰기가 막혀도 흐름은 보여야 한다. 손으로도 한 줄 넣을 수 있게 둔다. */}
        <form
          className="manual-line"
          onSubmit={(event) => {
            event.preventDefault()
            speech.addManualLine(manual)
            setManual('')
          }}
        >
          <label className="visually-hidden" htmlFor="manual-line-input">
            받아쓰기 대신 직접 입력
          </label>
          <input
            id="manual-line-input"
            value={manual}
            placeholder="받아쓰기가 안 되면 여기에 직접 적어 보내세요"
            onChange={(event) => setManual(event.target.value)}
          />
          <button type="submit" className="secondary-button" disabled={manual.trim() === ''}>
            보내기
          </button>
        </form>
      </section>

      {/* 진료 중 정리는 의사에게만 보인다. 환자 화면에 키워드를 띄우면 진단으로 읽힌다. */}
      {role === 'doctor' && (
        <>
          {redFlags.length > 0 && (
            <div className="red-flag-callout" role="alert">
              <strong>통화 중 응급 신호가 나왔습니다</strong>
              <ul>
                {redFlags.map((flag) => (
                  <li key={flag.id}>
                    <strong>{flag.label}</strong> — {flag.guidance}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <section className="consult-keywords" aria-labelledby="consult-keyword-heading">
            <h2 id="consult-keyword-heading">통화에서 나온 키워드</h2>
            {keywords.length === 0 ? (
              <p className="empty-note">아직 뽑을 말이 없습니다.</p>
            ) : (
              <div className="symptom-chips">
                {keywords.map((keyword) => (
                  <span
                    key={keyword.label}
                    className={`specialty-chip ${keyword.speaker === 'doctor' ? 'is-muted' : ''}`}
                  >
                    {keyword.label}
                  </span>
                ))}
              </div>
            )}
            <p className="clinical-caveat">
              말에 실제로 있었던 단어입니다. 진단명이 아닙니다.
            </p>
          </section>

          <section className="consult-keywords" aria-labelledby="record-draft-heading">
            <h2 id="record-draft-heading">진료 기록 초안</h2>
            <pre className="record-draft">
              {transcriptToRecordDraft(room.transcript) || '통화 기록이 쌓이면 초안이 만들어집니다.'}
            </pre>
            <button
              type="button"
              className="secondary-button"
              disabled={room.transcript.length === 0}
              onClick={() => {
                void navigator.clipboard?.writeText(transcriptToRecordDraft(room.transcript))
                setCopied(true)
              }}
            >
              {copied ? '복사함' : '초안 복사'}
            </button>
          </section>
        </>
      )}

      <p className="clinical-caveat">
        참여자 {state.role === 'doctor' ? '의사' : '환자'} ·{' '}
        {isDemoRoom
          ? '신청 없이 여는 시연용 방입니다. 주소를 아는 사람은 누구나 들어올 수 있습니다.'
          : '신청한 환자와 담당 의사만 들어올 수 있는 방입니다.'}{' '}
        가상 데이터로 만든 시연입니다.
      </p>
    </div>
  )
}
