import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '../../App'

async function fillSymptomStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('질문 제목'), '목이 아프고 콧물이 납니다')
  await user.type(
    screen.getByLabelText('증상을 자유롭게 적어주세요'),
    '사흘 전부터 인후통이 있고 콧물이 계속 납니다.',
  )
  await user.type(screen.getByLabelText('증상이 시작된 날'), '2026-08-06')
  await user.click(screen.getByRole('radio', { name: '점점 심해져요' }))
  await user.click(screen.getByRole('checkbox', { name: '코·목·귀' }))
  await user.click(screen.getByRole('radio', { name: '조금 불편해요' }))
  await user.click(screen.getByRole('button', { name: '다음' }))
}

describe('ask flow', () => {
  beforeEach(() => {
    window.location.hash = '#/home'
  })

  it('홈에서 시작해 질문을 등록하고 분류 결과를 본다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Q' }))
    expect(screen.getByRole('heading', { name: '증상 적어보기' })).toBeInTheDocument()

    await fillSymptomStep(user)
    await user.click(screen.getByRole('button', { name: '다음' }))
    await user.click(screen.getByRole('button', { name: '정리해서 보기' }))

    expect(await screen.findByRole('heading', { name: '어느 과로 가면 좋을까요' })).toBeInTheDocument()
    expect(screen.getByText('이비인후과')).toBeInTheDocument()
    expect(screen.getByText('진료과 분류 시연 규칙', { exact: false })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '게시판에 올리기' }))

    expect(screen.getByRole('button', { name: '올린 질문 보기' })).toBeInTheDocument()
    expect(screen.getAllByRole('status')[0]).toHaveTextContent('질문을 등록했습니다')
  })

  it('진료 이력을 밝히지 않으면 진료받았던 의사에게만 공개를 고를 수 없다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Q' }))
    await fillSymptomStep(user)
    await user.click(screen.getByRole('button', { name: '다음' }))

    expect(screen.getByRole('radio', { name: /내가 진료받았던 의사에게만/ })).toBeDisabled()
    expect(screen.getByText('진료 이력을 입력하면 선택할 수 있어요.')).toBeInTheDocument()
  })

  it('진료 이력을 밝히면 그 선택지가 열린다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Q' }))
    await fillSymptomStep(user)

    await user.click(screen.getByRole('radio', { name: '예' }))
    await user.type(screen.getByLabelText('언제 진료받으셨나요'), '2026-06-02')
    await user.click(screen.getByRole('button', { name: '다음' }))

    expect(screen.getByRole('radio', { name: /내가 진료받았던 의사에게만/ })).toBeEnabled()
  })

  it('응급 신호가 있으면 119 안내를 먼저 띄운다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Q' }))
    await user.type(screen.getByLabelText('질문 제목'), '가슴이 답답합니다')
    await user.type(
      screen.getByLabelText('증상을 자유롭게 적어주세요'),
      '어제부터 가슴통증이 있고 식은땀이 납니다.',
    )
    await user.type(screen.getByLabelText('증상이 시작된 날'), '2026-08-08')
    await user.click(screen.getByRole('button', { name: '다음' }))
    await user.click(screen.getByRole('button', { name: '다음' }))
    await user.click(screen.getByRole('button', { name: '정리해서 보기' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('119')
  })
})
