import { demoNowIso, demoToday } from './demoCalendar'

/**
 * 화면이 쓰는 시계.
 *
 * 픽스처의 기준일을 화면에서도 같이 쓰고 있었다. 그래서 8월 12일에 열면 병원이
 * 전부 오늘 휴진으로 보이고, 예약 날짜 후보에 지나간 날이 섞이고, 8월 9일에
 * 시작된 증상이 계속 "1일째"였다. 시간은 의료 화면에서 가장 먼저 믿는 값이라
 * 여기가 틀리면 나머지를 다 의심하게 된다.
 *
 * 픽스처는 그대로 demoToday 를 쓴다. 시연 데이터가 매일 흔들리면 안 된다.
 * 도메인은 여전히 오늘을 인자로 받는다. 여기서도 Date 는 이 파일에만 있다.
 */
export function todayIso(): string {
  const now = new Date()
  if (Number.isNaN(now.getTime())) return demoToday

  // toISOString 은 UTC 라 한국 시간 오전에 하루 전으로 밀린다. 지역 날짜를 쓴다.
  const year = now.getFullYear()
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function nowIso(): string {
  const now = new Date()
  return Number.isNaN(now.getTime()) ? demoNowIso : now.toISOString()
}
