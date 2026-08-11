import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '../../App'

describe('patient home and focused question composer', () => {
  it('홈은 남의 사연 대신 내 다음 할 일을 최상단에 둔다', () => {
    window.location.hash = '#/home'
    render(<App />)

    expect(screen.getByRole('heading', { name: '의사 2명이 답변했어요' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /답변 확인하기/ })).toBeInTheDocument()
    expect(screen.queryAllByTestId('question-card')).toHaveLength(0)
    expect(screen.getByRole('heading', { name: '최근 내 활동' })).toBeInTheDocument()
    expect(screen.getByText('지난번 처방 이후 경과를 여쭙습니다')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /내 주변 병원/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '진료 준비' })).toBeInTheDocument()
  })

  it('사전 확인이 남아 있으면 진행 상황을 알려준다', () => {
    window.location.hash = '#/home'
    render(<App />)

    expect(screen.getByText('비대면 진료 준비 0 / 4')).toBeInTheDocument()
  })

  it('질문 작성 중에는 일반 탭을 숨기고 닫으면 홈으로 돌아간다', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/ask'
    render(<App />)

    expect(screen.queryByRole('navigation', { name: '주요 화면' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '질문 작성 닫기' }))

    expect(screen.getByRole('heading', { name: '의사 2명이 답변했어요' })).toBeInTheDocument()
  })
})
