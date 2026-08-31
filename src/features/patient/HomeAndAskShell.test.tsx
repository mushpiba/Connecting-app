import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '../../App'

describe('patient home and focused question composer', () => {
  it('홈은 사연 피드다', () => {
    window.location.hash = '#/home'
    render(<App />)

    expect(screen.getByRole('heading', { name: '사연', level: 1 })).toBeInTheDocument()
    expect(screen.getAllByTestId('question-card').length).toBeGreaterThan(0)
    expect(screen.getByRole('tab', { name: '전체' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'HOT' })).toBeInTheDocument()
  })

  it('사연을 위에 올리는 기준을 화면에 적는다', () => {
    window.location.hash = '#/home'
    render(<App />)

    expect(
      screen.getByText(
        '사연은 올라온 순서대로만 보입니다. 어느 사연을 위에 올릴지 MediVU가 정하지 않습니다.',
      ),
    ).toBeInTheDocument()
  })

  it('진행 중인 건이 있으면 피드 위에 한 줄로 세우고 그 사연으로 보낸다', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/home'
    render(<App />)

    const strip = screen.getByRole('button', { name: /의사 2명이 답변했어요/ })
    await user.click(strip)

    expect(screen.getByRole('heading', { name: '2주째 콧물과 코막힘이 안 나아요' })).toBeInTheDocument()
  })

  it('내 사연 탭을 홈에 두지 않는다', () => {
    window.location.hash = '#/home'
    render(<App />)

    expect(screen.queryByRole('tab', { name: '내 사연' })).not.toBeInTheDocument()
  })

  it('자기 사연에는 공감이 뜨지 않는다', () => {
    window.location.hash = '#/home'
    render(<App />)

    const mine = screen
      .getAllByTestId('question-card')
      .find((card) => within(card).queryByText('2주째 콧물과 코막힘이 안 나아요'))

    expect(mine).toBeDefined()
    expect(within(mine!).queryByRole('button', { name: /공감/ })).not.toBeInTheDocument()
  })

  it('질문 작성 중에는 일반 탭을 숨기고 닫으면 홈으로 돌아간다', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/ask'
    render(<App />)

    expect(screen.queryByRole('navigation', { name: '주요 화면' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '질문 작성 닫기' }))

    expect(screen.getByRole('heading', { name: '사연', level: 1 })).toBeInTheDocument()
  })
})
