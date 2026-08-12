import '@testing-library/jest-dom/vitest'
import { demoNowIso } from '../data/demoCalendar'

/*
 * 테스트는 달력에 묶이지 않는다. 화면이 실제 시계를 쓰게 바꿨으므로, 시계
 * 자체를 시연 기준일로 세워 둔다. 이렇게 하지 않으면 내일 되면 예약 화면
 * 테스트가 깨진다.
 */
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(new Date(demoNowIso))
  localStorage.setItem('medivu.onboarding.complete.v1', 'true')
})

afterEach(() => {
  vi.useRealTimers()
})
