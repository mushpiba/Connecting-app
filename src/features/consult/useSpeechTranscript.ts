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
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const onLineRef = useRef(onLine)
  onLineRef.current = onLine

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setListening(false)
    setInterim('')
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

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') setError('마이크 사용을 허용해 주세요.')
      else if (event.error !== 'no-speech') setError(`받아쓰기 오류: ${event.error}`)
    }

    /** 길게 말이 없으면 브라우저가 알아서 끊는다. 듣는 중이면 다시 켠다. */
    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        try {
          recognition.start()
        } catch {
          setListening(false)
        }
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
    setError('')
  }, [speaker])

  useEffect(() => () => stop(), [stop])

  return { listening, interim, error, start, stop, supported: speechSupported }
}
