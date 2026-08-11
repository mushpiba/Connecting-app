import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '../../App'

describe('onboarding flow', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('첫 방문을 안내한 뒤 원래 열려던 화면으로 돌아간다', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/stories'
    render(<App />)

    expect(screen.getByRole('heading', { name: '의료 고민을 사연으로 시작하세요' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '건너뛰기' }))

    expect(localStorage.getItem('medivu.onboarding.complete.v1')).toBe('true')
    expect(screen.getByRole('heading', { name: '사연' })).toBeInTheDocument()
  })

  it('완료한 기기에서는 홈을 바로 연다', () => {
    localStorage.setItem('medivu.onboarding.complete.v1', 'true')
    window.location.hash = '#/home'

    render(<App />)

    expect(screen.getByRole('heading', { name: '어디가 불편하신가요' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '의료 고민을 사연으로 시작하세요' })).not.toBeInTheDocument()
  })
})
