import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'

describe('App', () => {
  beforeEach(() => {
    window.location.hash = ''
  })

  it('모르는 경로는 홈으로 보낸다', () => {
    window.location.hash = '#/nowhere'
    render(<App />)

    expect(screen.getByRole('heading', { name: '의사 2명이 답변했어요' })).toBeInTheDocument()
  })

  it('역할을 의사로 바꾸면 받은 질문 화면으로 간다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'expert' }))
    await user.click(screen.getByRole('button', { name: /가상 김이비/ }))

    expect(screen.getByRole('heading', { name: '받은 질문' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('의사 화면으로 전환했습니다.')
  })

  it('데모 초기화가 처음 상태로 되돌린다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'expert' }))
    await user.click(screen.getByRole('button', { name: /가상 김이비/ }))
    await user.click(screen.getByRole('button', { name: '환자 화면' }))
    await user.click(screen.getByRole('button', { name: 'MY' }))
    await user.click(screen.getByRole('button', { name: '데모 초기화' }))

    expect(screen.getByRole('status')).toHaveTextContent('데모가 초기 상태로 복원됐습니다.')
  })
})
