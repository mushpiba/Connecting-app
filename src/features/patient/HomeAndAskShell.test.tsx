import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '../../App'

describe('patient home and focused question composer', () => {
  it('홈에서 사전 확인, 받은 답변, HOT 사연을 요약한다', () => {
    window.location.hash = '#/home'
    render(<App />)

    expect(screen.getByRole('heading', { name: '어디가 불편하신가요' })).toBeInTheDocument()
    expect(screen.getByText('사전 확인 필요')).toBeInTheDocument()
    expect(screen.getByText('받은 답변 2개')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'HOT 사연' })).toBeInTheDocument()
    expect(screen.getAllByTestId('question-card')).toHaveLength(3)
  })

  it('질문 작성 중에는 일반 탭을 숨기고 닫으면 홈으로 돌아간다', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/ask'
    render(<App />)

    expect(screen.queryByRole('navigation', { name: '주요 화면' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '질문 작성 닫기' }))

    expect(screen.getByRole('heading', { name: '어디가 불편하신가요' })).toBeInTheDocument()
  })
})
