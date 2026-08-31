import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '../../App'

describe('patient tab screens', () => {
  // G-4가 「내 사연」을 `/news`로 흡수했다. 홈은 남의 사연을 읽는 자리다.
  it('내소식에는 내가 쓴 글만 나오고 남의 글은 안 나온다', () => {
    window.location.hash = '#/news'
    render(<App />)

    // 낱개로 늘어놓으므로 답변이 둘 달린 사연은 제목이 여러 번 나온다.
    expect(screen.getAllByText('2주째 콧물과 코막힘이 안 나아요').length).toBeGreaterThan(0)
    expect(screen.queryByText('두 달째 잠이 안 옵니다')).not.toBeInTheDocument()
  })

  // 〃 G-4. 공개 범위를 볼 자리가 앱에 여기뿐이다.
  it('내소식은 비공개로 올린 글과 공개 범위를 함께 보여준다', () => {
    window.location.hash = '#/news'
    render(<App />)

    expect(screen.getByText('지난번 처방 이후 경과를 여쭙습니다')).toBeInTheDocument()
    expect(screen.getByText('진료받은 의사만')).toBeInTheDocument()
  })

  it('내소식은 무엇을 위에 올리는지 적는다', () => {
    window.location.hash = '#/news'
    render(<App />)

    expect(screen.getByText('최근에 일어난 일부터 보여 줍니다.')).toBeInTheDocument()
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
    expect(screen.getByText('0 / 4 완료')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '비대면 진료 사전 확인' }))

    expect(screen.getByRole('heading', { name: '비대면 진료 사전 확인' })).toBeInTheDocument()
  })
})
