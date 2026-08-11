import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '../../App'

describe('patient tab screens', () => {
  it('사연에서 내가 쓴 글만 골라본다', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/stories'
    render(<App />)

    await user.click(screen.getByRole('tab', { name: '내 사연' }))

    expect(
      screen.getByRole('button', { name: '2주째 콧물과 코막힘이 안 나아요 자세히 보기' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '두 달째 잠이 안 옵니다 자세히 보기' }),
    ).not.toBeInTheDocument()
  })

  it('내 사연에는 비공개로 올린 글과 공개 범위를 함께 보여준다', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/stories'
    render(<App />)

    await user.click(screen.getByRole('tab', { name: '내 사연' }))

    expect(
      screen.getByRole('button', { name: '지난번 처방 이후 경과를 여쭙습니다 자세히 보기' }),
    ).toBeInTheDocument()
    expect(screen.getByText('진료받은 의사만')).toBeInTheDocument()
  })

  it('내소식에 내 사연과 도착한 답변만 보여준다', () => {
    window.location.hash = '#/news'
    render(<App />)

    expect(screen.getByRole('heading', { name: '내소식' })).toBeInTheDocument()
    expect(screen.getByText('지난번 처방 이후 경과를 여쭙습니다')).toBeInTheDocument()
    expect(screen.getByText(/가상 이가정 의사가 답변했어요/)).toBeInTheDocument()
    expect(screen.queryByText('세 과를 돌았는데 두드러기 원인을 못 찾았어요')).not.toBeInTheDocument()
  })

  it('MY 요약에서 비대면 진료 사전 확인을 연다', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/me'
    render(<App />)

    expect(screen.getByRole('heading', { name: 'MY' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '내 사연 3건' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '받은 답변 2건' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '비대면 진료 사전 확인' }))

    expect(screen.getByRole('heading', { name: '비대면 진료 사전 확인' })).toBeInTheDocument()
  })
})
