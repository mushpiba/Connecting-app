import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '../../App'

describe('board empathy flow', () => {
  beforeEach(() => {
    window.location.hash = '#/board'
  })

  it('전체 탭은 최신순으로 늘어놓는다', () => {
    render(<App />)

    const cards = screen.getAllByTestId('question-card')
    expect(within(cards[0]).getByText(/가슴통증이 있었는데/)).toBeInTheDocument()
  })

  it('HOT 탭에서만 공감이 많은 글을 모아 본다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: 'HOT' }))

    const cards = screen.getAllByTestId('question-card')
    expect(cards.length).toBeGreaterThan(0)
    cards.forEach((card) => {
      expect(within(card).getByText('이번 주 많이 공감한 글')).toBeInTheDocument()
    })
  })

  it('진료과를 골라 그 과의 사연만 본다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /전체 진료과/ }))
    await user.click(screen.getByRole('button', { name: '피부과' }))

    expect(screen.getByText(/두드러기 원인을 못 찾았어요/)).toBeInTheDocument()
    expect(screen.queryByText('두 달째 잠이 안 옵니다')).not.toBeInTheDocument()
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
