/**
 * 기기 안에만 남기는 저장소.
 *
 * 사전 확인과 주소는 새로고침하면 사라지면 안 된다. 여럿이 모여 테스트할 때
 * 화면을 한 번 새로 고쳤다고 준비가 통째로 풀리면 아무것도 이어서 못 한다.
 *
 * 서버로 올리지 않는다. 사는 지역과 질환 예외는 사람에 관한 값이고, 이 데모의
 * 데이터베이스는 해외 리전이며 의료정보를 다룰 접근통제가 없다. 기기 밖으로
 * 내보내지 않는 선에서만 남긴다.
 */
export function readLocal<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : ({ ...fallback, ...JSON.parse(raw) } as T)
  } catch {
    return fallback
  }
}

export function writeLocal(key: string, value: unknown): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 저장 공간이 막혀 있어도 화면은 계속 돌아야 한다.
  }
}

export function clearLocal(key: string): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(key)
  } catch {
    // 위와 같다.
  }
}
