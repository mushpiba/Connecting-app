import { isPrecheckComplete } from './telemedicine'
import type { TelemedicinePrecheck } from './types'

export interface PrepStep {
  id: string
  label: string
  done: boolean
}

export interface PrepProgress {
  steps: PrepStep[]
  doneCount: number
  total: number
  percent: number
  complete: boolean
}

/**
 * 비대면 진료를 받으려면 무엇이 남았는지 센다.
 *
 * 사전 확인을 "완료/미완료" 한 덩어리로 보여주면 무엇이 부족한지 알 수 없어
 * 사람이 끝까지 가지 않는다. 남은 항목을 낱개로 드러낸다.
 */
export function carePrepProgress(
  precheck: TelemedicinePrecheck,
  hasAddress: boolean,
): PrepProgress {
  const steps: PrepStep[] = [
    { id: 'identity', label: '본인 확인', done: precheck.identityVerified },
    { id: 'terms', label: '조건 확인', done: precheck.agreedToTerms },
    { id: 'precheck', label: '사전 확인 저장', done: isPrecheckComplete(precheck) },
    { id: 'address', label: '주소 설정', done: hasAddress },
  ]

  const doneCount = steps.filter((step) => step.done).length

  return {
    steps,
    doneCount,
    total: steps.length,
    percent: Math.round((doneCount / steps.length) * 100),
    complete: doneCount === steps.length,
  }
}
