import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '../../App'

describe('booking flow', () => {
  beforeEach(() => {
    window.location.hash = '#/doctors/doc-han-ent'
  })

  it('프로필에서 예약 화면으로 넘어간다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /초진 대면 진료 예약/ }))

    expect(screen.getByRole('heading', { name: '초진 대면 진료 예약' })).toBeInTheDocument()
  })

  it('휴진일은 고를 수 없다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /초진 대면 진료 예약/ }))

    expect(screen.getByRole('button', { name: '2026-08-09 일요일 휴진' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '2026-08-10 월요일' })).toBeEnabled()
  })

  it('가장 빠른 진료일을 미리 골라 둔다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /초진 대면 진료 예약/ }))

    expect(screen.getByRole('button', { name: '2026-08-10 월요일' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('점심시간은 시간 칸에 넣지 않는다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /초진 대면 진료 예약/ }))

    expect(screen.getByRole('button', { name: '12:30' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '13:00' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '14:00' })).toBeInTheDocument()
  })

  it('시간을 고르기 전에는 전달 버튼이 비활성이다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /초진 대면 진료 예약/ }))

    expect(screen.getByRole('button', { name: '희망 시간 전달' })).toBeDisabled()
  })

  it('날짜와 시간을 고르면 희망 시간을 전달한다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /초진 대면 진료 예약/ }))
    await user.click(screen.getByRole('button', { name: '2026-08-11 화요일' }))
    await user.click(screen.getByRole('button', { name: '10:30' }))
    await user.click(screen.getByRole('button', { name: '희망 시간 전달' }))

    expect(screen.getByText(/2026-08-11 10:30 희망 시간을 전달했습니다/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '희망 시간 전달' })).not.toBeInTheDocument()
  })

  it('토요일은 오후 칸을 열지 않는다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /초진 대면 진료 예약/ }))
    await user.click(screen.getByRole('button', { name: '2026-08-15 토요일' }))

    expect(screen.getByRole('button', { name: '12:30' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '15:00' })).not.toBeInTheDocument()
  })

  it('토요일 휴진 의료기관은 토요일을 막는다', async () => {
    const user = userEvent.setup()
    render(<App />)

    window.location.hash = '#/doctors/doc-skin-derm'
    await user.click(await screen.findByRole('button', { name: /초진 대면 진료 예약/ }))

    expect(screen.getByRole('button', { name: '2026-08-15 토요일 휴진' })).toBeDisabled()
  })

  it('날짜 목록은 2주치를 준다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /초진 대면 진료 예약/ }))
    const strip = screen.getByRole('list', { name: '예약 가능 날짜' })

    expect(within(strip).getAllByRole('button')).toHaveLength(14)
  })
})
