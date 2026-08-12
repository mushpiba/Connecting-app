import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { triageRuleSet } from '../../data/rules/triageRules'
import {
  consultRedFlags,
  extractConsultKeywords,
  transcriptToRecordDraft,
} from '../../domain/consultation'
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
  const { state } = useCommunity()
  const [consented, setConsented] = useState(false)
  const [copied, setCopied] = useState(false)

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
          <button type="button" className="danger-button" onClick={room.leave}>
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
        진료방 주소 <code>{roomId}</code> · 참여자 {state.role === 'doctor' ? '의사' : '환자'} ·
        가상 데이터로 만든 시연입니다.
      </p>
    </div>
  )
}
