import { carePrepProgress } from './carePrep'
import type { TelemedicinePrecheck } from './types'

function precheck(overrides: Partial<TelemedicinePrecheck> = {}): TelemedicinePrecheck {
  return {
    completedAt: null,
    identityVerified: false,
    region: '인천 미추홀구',
    monthlyTelemedicineCount: 0,
    exception: 'none',
    agreedToTerms: false,
    ...overrides,
  }
}

describe('carePrepProgress', () => {
  it('아무것도 안 했으면 0퍼센트다', () => {
    const progress = carePrepProgress(precheck(), false)

    expect(progress.doneCount).toBe(0)
    expect(progress.percent).toBe(0)
    expect(progress.complete).toBe(false)
  })

  it('남은 항목을 낱개로 알려준다', () => {
    const progress = carePrepProgress(precheck({ identityVerified: true }), false)

    expect(progress.steps.filter((step) => !step.done).map((step) => step.id)).toEqual([
      'terms',
      'precheck',
      'address',
    ])
  })

  it('사전 확인을 저장하고 주소를 넣으면 끝난다', () => {
    const progress = carePrepProgress(
      precheck({ identityVerified: true, agreedToTerms: true, completedAt: '2026-08-09T10:00:00.000Z' }),
      true,
    )

    expect(progress.percent).toBe(100)
    expect(progress.complete).toBe(true)
  })

  it('본인 확인 없이 저장되는 일은 없다', () => {
    const progress = carePrepProgress(precheck({ agreedToTerms: true, completedAt: 'x' }), true)

    expect(progress.steps.find((step) => step.id === 'precheck')?.done).toBe(false)
  })
})
