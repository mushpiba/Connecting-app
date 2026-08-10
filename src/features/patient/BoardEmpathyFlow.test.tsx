import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '../../App'

describe('board empathy flow', () => {
  beforeEach(() => {
    window.location.hash = '#/board'
  })

  it('주간 공감이 많은 글을 상단에 고정한다', () => {
    render(<App />)

    const cards = screen.getAllByTestId('question-card')
    expect(within(cards[0]).getByText('이번 주 많이 공감한 글')).toBeInTheDocument()
    expect(within(cards[0]).getByText(/두드러기 원인을 못 찾았어요/)).toBeInTheDocument()
  })

  it('공감을 누르면 수가 오르고 다시 누르면 내려간다', async () => {
    const user = userEvent.setup()
    render(<App />)

    const button = screen.getByRole('button', {
      name: '2주째 콧물과 코막힘이 안 나아요 공감',
    })
    expect(button).toHaveTextContent('공감 3')

    await user.click(button)
    expect(button).toHaveTextContent('공감 4')
    expect(button).toHaveAttribute('aria-pressed', 'true')

    await user.click(button)
    expect(button).toHaveTextContent('공감 3')
    expect(button).toHaveAttribute('aria-pressed', 'false')
  })

  it('비공개 글은 게시판에 올라오지 않는다', () => {
    render(<App />)

    expect(screen.queryByText('식후 속쓰림이 반복됩니다')).not.toBeInTheDocument()
    expect(screen.queryByText('지난번 처방 이후 경과를 여쭙습니다')).not.toBeInTheDocument()
  })

  it('게시글을 열면 의사 답변과 프로필 카드를 보여준다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(
      screen.getByRole('button', { name: '2주째 콧물과 코막힘이 안 나아요 자세히 보기' }),
    )

    expect(screen.getByRole('heading', { name: '의사 답변 2' })).toBeInTheDocument()
    expect(screen.getByTestId('answer-card-doc-han-ent')).toBeInTheDocument()
  })

  it('내 글에서는 진료과 안내를 보여준다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(
      screen.getByRole('button', { name: '2주째 콧물과 코막힘이 안 나아요 자세히 보기' }),
    )

    expect(screen.getByRole('heading', { name: '어느 과로 가면 좋을까요' })).toBeInTheDocument()
  })

  it('다른 사람 글에서는 진료과 안내 카드를 띄우지 않는다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(
      screen.getByRole('button', { name: '세 과를 돌았는데 두드러기 원인을 못 찾았어요 자세히 보기' }),
    )

    expect(screen.queryByRole('heading', { name: '어느 과로 가면 좋을까요' })).not.toBeInTheDocument()
    expect(screen.getByText('피부과')).toBeInTheDocument()
  })
})
