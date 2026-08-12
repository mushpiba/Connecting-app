import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../data/supabaseClient'
import { mergeTranscript } from '../../domain/consultation'
import type { TranscriptLine } from '../../domain/types'

export type RoomStatus = 'idle' | 'joining' | 'waiting' | 'connected' | 'ended' | 'unsupported'

/**
 * TURN 서버가 없다. 공개 STUN 으로 대부분의 가정·사무실 회선은 뚫리지만
 * 대칭 NAT 뒤에서는 연결이 안 된다. 그때는 TURN 을 붙여야 한다.
 */
const ICE_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
]

interface UseConsultRoom {
  status: RoomStatus
  error: string
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  transcript: TranscriptLine[]
  join: () => Promise<void>
  leave: () => void
  /** 내 마이크에서 받아 적은 줄을 상대에게 보낸다. */
  publishLine: (line: TranscriptLine) => void
}

/**
 * 1:1 화상 진료방.
 *
 * 신호는 Supabase Realtime 으로 주고받고 미디어는 브라우저끼리 직접 흐른다.
 * 서버를 하나 더 세우지 않으려는 선택이고, 나중에 프레임을 직접 암호화하려면
 * 어차피 PeerConnection 을 우리가 들고 있어야 한다.
 *
 * 전사는 각자 자기 마이크만 받아 적어 데이터 채널로 상대에게 보낸다. 상대
 * 목소리를 내가 받아 적으면 마이크 품질에 따라 엉뚱한 말이 기록된다.
 */
export function useConsultRoom(roomId: string, isCaller: boolean): UseConsultRoom {
  const [status, setStatus] = useState<RoomStatus>('idle')
  const [error, setError] = useState('')
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [transcript, setTranscript] = useState<TranscriptLine[]>([])

  const peerRef = useRef<RTCPeerConnection | null>(null)
  const channelRef = useRef<ReturnType<NonNullable<typeof supabase>['channel']> | null>(null)
  const dataRef = useRef<RTCDataChannel | null>(null)

  const attachDataChannel = useCallback((channel: RTCDataChannel) => {
    dataRef.current = channel
    channel.onmessage = (event) => {
      try {
        const line = JSON.parse(event.data) as TranscriptLine
        setTranscript((prev) => mergeTranscript(prev, [line]))
      } catch {
        // 상대가 보낸 것이 전사 줄이 아니면 무시한다.
      }
    }
  }, [])

  const leave = useCallback(() => {
    peerRef.current?.close()
    peerRef.current = null
    dataRef.current = null
    if (channelRef.current && supabase) void supabase.removeChannel(channelRef.current)
    channelRef.current = null
    setLocalStream((stream) => {
      stream?.getTracks().forEach((track) => track.stop())
      return null
    })
    setRemoteStream(null)
    setStatus('ended')
  }, [])

  const join = useCallback(async () => {
    if (!supabase || typeof RTCPeerConnection === 'undefined' || !navigator.mediaDevices) {
      setStatus('unsupported')
      return
    }

    setStatus('joining')
    setError('')

    let media: MediaStream
    try {
      media = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
    } catch {
      setError('카메라와 마이크 사용을 허용해 주세요.')
      setStatus('idle')
      return
    }

    setLocalStream(media)

    const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    peerRef.current = peer
    media.getTracks().forEach((track) => peer.addTrack(track, media))

    peer.ontrack = (event) => setRemoteStream(event.streams[0])
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'connected') setStatus('connected')
      if (peer.connectionState === 'failed') {
        setError('연결에 실패했습니다. 회선에 따라 중계 서버가 필요할 수 있습니다.')
        setStatus('ended')
      }
    }

    const channel = supabase.channel(`consult:${roomId}`, { config: { broadcast: { self: false } } })
    channelRef.current = channel

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        void channel.send({
          type: 'broadcast',
          event: 'ice',
          payload: { candidate: event.candidate.toJSON() },
        })
      }
    }

    if (isCaller) {
      attachDataChannel(peer.createDataChannel('transcript'))
    } else {
      peer.ondatachannel = (event) => attachDataChannel(event.channel)
    }

    channel.on('broadcast', { event: 'offer' }, async ({ payload }) => {
      if (isCaller) return
      await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp))
      const answer = await peer.createAnswer()
      await peer.setLocalDescription(answer)
      void channel.send({ type: 'broadcast', event: 'answer', payload: { sdp: answer } })
    })

    channel.on('broadcast', { event: 'answer' }, async ({ payload }) => {
      if (!isCaller) return
      if (peer.currentRemoteDescription) return
      await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp))
    })

    channel.on('broadcast', { event: 'ice' }, async ({ payload }) => {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(payload.candidate))
      } catch {
        // 원격 설명이 아직 없으면 무시한다. 재협상 때 다시 온다.
      }
    })

    /** 상대가 들어왔다고 알리면 부르는 쪽이 제안을 보낸다. */
    channel.on('broadcast', { event: 'ready' }, async () => {
      if (!isCaller) return
      const offer = await peer.createOffer()
      await peer.setLocalDescription(offer)
      void channel.send({ type: 'broadcast', event: 'offer', payload: { sdp: offer } })
    })

    channel.subscribe((state) => {
      if (state === 'SUBSCRIBED') {
        setStatus('waiting')
        void channel.send({ type: 'broadcast', event: 'ready', payload: {} })
      }
    })
  }, [attachDataChannel, isCaller, roomId])

  const publishLine = useCallback((line: TranscriptLine) => {
    setTranscript((prev) => mergeTranscript(prev, [line]))
    if (dataRef.current?.readyState === 'open') {
      dataRef.current.send(JSON.stringify(line))
    }
  }, [])

  useEffect(() => () => leave(), [leave])

  return { status, error, localStream, remoteStream, transcript, join, leave, publishLine }
}
