import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '../../App'

describe('patient home and focused question composer', () => {
  it('홈에서 공개 게시물 없이 내 활동과 진료 준비를 요약한다', () => {
    window.location.hash = '#/home'
    render(<App />)

    expect(screen.getByRole('heading', { name: '어디가 불편하신가요' })).toBeInTheDocument()
    expect(screen.getByText('사전 확인 필요')).toBeInTheDocument()
    expect(screen.getByText('받은 답변 2개')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'HOT 사연' })).not.toBeInTheDocument()
    expect(screen.queryAllByTestId('question-card')).toHaveLength(0)
    expect(screen.getByRole('heading', { name: '최근 내 활동' })).toBeInTheDocument()
    expect(screen.getByText('지난번 처방 이후 경과를 여쭙습니다')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '예약 내역' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '사연 둘러보기' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '진료 준비' })).toBeInTheDocument()
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
