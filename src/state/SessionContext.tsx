import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { isLiveMode, supabase } from '../data/supabaseClient'
import type { ProfileRow } from '../data/liveMappers'

export type SessionStatus = 'demo' | 'loading' | 'signed-out' | 'ready' | 'error'

interface SessionContextValue {
  status: SessionStatus
  profile: ProfileRow | null
  error: string
  joinAs: (displayName: string, region: string) => Promise<void>
  leave: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

/**
 * 익명 로그인으로 들어온다. 모여서 하는 테스트라 이메일 인증을 거칠 이유가 없고,
 * 무엇보다 이 데모에는 실제 신원을 담을 자리가 없다.
 *
 * 역할과 면허 검증은 여기서 못 정한다. 데이터베이스 트리거가 막아 두었고
 * 주최자가 SQL로 올린다. 스스로 켤 수 있으면 검증이 아니다.
 */
export function SessionProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<SessionStatus>(isLiveMode ? 'loading' : 'demo')
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [error, setError] = useState('')

  const loadProfile = useCallback(async (userId: string) => {
    const client = supabase!
    const { data, error: loadError } = await client
      .from('profiles')
      .select('id, display_name, role, region, license_verified, clinic_id, specialty')
      .eq('id', userId)
      .maybeSingle()

    if (loadError) {
      setError(loadError.message)
      setStatus('error')
      return
    }

    if (!data) {
      setStatus('signed-out')
      return
    }

    setProfile(data as ProfileRow)
    setStatus('ready')
  }, [])

  useEffect(() => {
    if (!isLiveMode || !supabase) return

    let cancelled = false

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      if (data.session) {
        void loadProfile(data.session.user.id)
      } else {
        setStatus('signed-out')
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return
      if (session) {
        void loadProfile(session.user.id)
      } else {
        setProfile(null)
        setStatus('signed-out')
      }
    })

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [loadProfile])

  const joinAs = useCallback(async (displayName: string, region: string) => {
    if (!supabase) return
    setStatus('loading')
    setError('')

    const existing = await supabase.auth.getSession()
    let userId = existing.data.session?.user.id

    if (!userId) {
      const { data, error: signInError } = await supabase.auth.signInAnonymously()
      if (signInError || !data.user) {
        setError(signInError?.message ?? '로그인에 실패했습니다.')
        setStatus('error')
        return
      }
      userId = data.user.id
    }

    const { error: insertError } = await supabase
      .from('profiles')
      .upsert({ id: userId, display_name: displayName, region }, { onConflict: 'id' })

    if (insertError) {
      setError(insertError.message)
      setStatus('error')
      return
    }

    await loadProfile(userId)
  }, [loadProfile])

  const leave = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setProfile(null)
    setStatus('signed-out')
  }, [])

  const value = useMemo<SessionContextValue>(
    () => ({ status, profile, error, joinAs, leave }),
    [status, profile, error, joinAs, leave],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession must be used inside SessionProvider')
  return context
}
