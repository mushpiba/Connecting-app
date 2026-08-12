import { useCallback, useEffect, useRef, useState } from 'react'
import type { TranscriptLine } from '../../domain/types'

interface SpeechRecognitionLike extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}

interface SpeechRecognitionEventLike {
  resultIndex: number
  results: {
    length: number
    [index: number]: { isFinal: boolean; 0: { transcript: string } }
  }
}

function recognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export const speechSupported = recognitionCtor() !== null

/**
 * 내 마이크만 받아 적는다.
 *
 * ⚠️ Web Speech API 는 오디오를 브라우저 제조사 서버로 보낸다. 이 데모는 가상
 * 데이터만 다루므로 쓰지만, 실제 환자 대화에는 쓸 수 없다. 실서비스에서는
 * 브라우저 안에서 도는 모델(로컬 Whisper 등)로 바꿔야 하고, 그래야 통화를
 * 종단간 암호화한다는 말이 성립한다.
 *
 * 그 교체 지점을 여기 한 곳으로 두었다. 이 훅의 바깥은 아무것도 모른다.
 */
export function useSpeechTranscript(
  speaker: TranscriptLine['speaker'],
  onLine: (line: TranscriptLine) => void,
) {
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState('')
  /** 마지막으로 무슨 일이 있었는지. 아무 반응이 없을 때 이것만 보면 된다. */
  const [lastEvent, setLastEvent] = useState('')
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const restartRef = useRef<number | null>(null)
  const onLineRef = useRef(onLine)
  onLineRef.current = onLine

  const stop = useCallback(() => {
    if (restartRef.current !== null) window.clearTimeout(restartRef.current)
    restartRef.current = null
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setListening(false)
    setInterim('')
    setLastEvent('멈춤')
  }, [])

  const start = useCallback(() => {
    const Ctor = recognitionCtor()
    if (!Ctor) {
      setError('이 브라우저는 받아쓰기를 지원하지 않습니다. Chrome에서 열어 주세요.')
      return
    }

    const recognition = new Ctor()
    recognition.lang = 'ko-KR'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event) => {
      setLastEvent('말을 받는 중')
      let pending = ''
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        const text = result[0].transcript.trim()
        if (!text) continue

        if (result.isFinal) {
          onLineRef.current({
            id: `${speaker}-${Date.now()}-${index}`,
            speaker,
            text,
            at: new Date().toISOString(),
          })
        } else {
          pending = text
        }
      }
      setInterim(pending)
    }

    /*
     * 오류를 삼키지 않는다. 아무 말도 안 들어올 때 왜 그런지 알 방법이 이것뿐이다.
     * no-speech 는 흔한 일이라 오류가 아니라 상태로 보여 준다.
     */
    recognition.onerror = (event) => {
      setLastEvent(`오류: ${event.error}`)
      if (event.error === 'not-allowed') {
        setError('마이크 사용을 허용해 주세요. 주소창 왼쪽 자물쇠에서 마이크를 허용으로 바꿉니다.')
      } else if (event.error === 'audio-capture') {
        setError('마이크를 잡지 못했습니다. 통화가 마이크를 쓰는 중이면 브라우저가 막을 수 있습니다.')
      } else if (event.error === 'network') {
        setError('받아쓰기 서버에 닿지 못했습니다. 브라우저 내장 받아쓰기는 인터넷이 필요합니다.')
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setError(`받아쓰기 오류: ${event.error}`)
      }
    }

    /**
     * 길게 말이 없으면 브라우저가 알아서 끊는다. 듣는 중이면 다시 켠다.
     * 바로 다시 켜면 시작과 종료가 겹쳐 조용히 죽는다. 한 박자 쉬고 켠다.
     */
    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return
      setLastEvent('다시 듣는 중')
      restartRef.current = window.setTimeout(() => {
        if (recognitionRef.current !== recognition) return
        try {
          recognition.start()
        } catch {
          setListening(false)
          setLastEvent('다시 켜지 못했습니다')
        }
      }, 400)
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
      setListening(true)
      setError('')
      setLastEvent('듣기 시작')
    } catch (startError) {
      setError(`받아쓰기를 켜지 못했습니다: ${String(startError)}`)
      setListening(false)
    }
  }, [speaker])

  useEffect(() => () => stop(), [stop])

  /** 받아쓰기가 막힐 때를 대비한 손입력. 시연이 받아쓰기 상태에 묶이면 안 된다. */
  const addManualLine = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      onLineRef.current({
        id: `${speaker}-manual-${Date.now()}`,
        speaker,
        text: trimmed,
        at: new Date().toISOString(),
      })
    },
    [speaker],
  )

  return {
    listening,
    interim,
    error,
    lastEvent,
    start,
    stop,
    addManualLine,
    supported: speechSupported,
  }
}
