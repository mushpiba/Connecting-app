import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * 프로젝트 주소와 anon 키는 브라우저에 그대로 실리는 공개값이다. 숨길 수 없고
 * 숨길 필요도 없다. 실제 차단은 supabase/schema.sql 의 RLS 정책이 한다.
 * service_role 키는 RLS를 통째로 무시하므로 절대 이 파일에 넣지 않는다.
 */
const url = import.meta.env.VITE_SUPABASE_URL ?? 'https://sujnyeahfxjqhenngoye.supabase.co'
const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1am55ZWFoZnhqcWhlbm5nb3llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NTUxNDgsImV4cCI6MjEwMjAzMTE0OH0.3spTFB5VTaHf6cPMWaBefd1EYuuT5QNUqWxAD7498mk'

/**
 * 테스트는 항상 인메모리 데모로 돈다. jsdom에는 네트워크가 없고, 무엇보다
 * 화면 동작을 검증하는 자리에서 남의 서버 상태에 기대면 안 된다.
 */
export const isLiveMode = !import.meta.env.VITEST && Boolean(url) && Boolean(anonKey)

export const supabase: SupabaseClient | null = isLiveMode
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null

export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}
