import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '../../App'

describe('onboarding flow', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('첫 방문을 안내한 뒤 원래 열려던 화면으로 돌아간다', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/news'
    render(<App />)

    expect(screen.getByRole('heading', { name: '의료 고민을 사연으로 시작하세요' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '건너뛰기' }))

    expect(localStorage.getItem('medivu.onboarding.complete.v1')).toBe('true')
    expect(screen.getByRole('heading', { name: '내소식' })).toBeInTheDocument()
  })

  it('완료한 기기에서는 홈을 바로 연다', () => {
    localStorage.setItem('medivu.onboarding.complete.v1', 'true')
    window.location.hash = '#/home'

    render(<App />)

    expect(screen.getByRole('heading', { name: '사연', level: 1 })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '의료 고민을 사연으로 시작하세요' })).not.toBeInTheDocument()
  })

  it('3단계를 완료해도 완료 여부 한 항목만 저장한다', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/home'
    render(<App />)

    await user.click(screen.getByRole('button', { name: '다음' }))
    await user.click(screen.getByRole('button', { name: '다음' }))
    await user.click(screen.getByRole('button', { name: 'MediVU 시작하기' }))

    expect(Object.keys(localStorage)).toEqual(['medivu.onboarding.complete.v1'])
    expect(screen.getByRole('heading', { name: '사연', level: 1 })).toBeInTheDocument()
  })

  it('MY에서 다시 보고 나면 MY로 돌아온다', async () => {
    const user = userEvent.setup()
    localStorage.setItem('medivu.onboarding.complete.v1', 'true')
    window.location.hash = '#/me'
    render(<App />)

    await user.click(screen.getByRole('button', { name: /앱 사용법 다시 보기/ }))
    expect(screen.getByRole('heading', { name: '의료 고민을 사연으로 시작하세요' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '건너뛰기' }))
    expect(screen.getByRole('heading', { name: 'MY' })).toBeInTheDocument()
  })
})
