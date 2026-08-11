import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '../../App'

async function viewAs(user: ReturnType<typeof userEvent.setup>, optionLabel: string) {
  await user.click(screen.getByRole('button', { name: 'expert' }))
  await user.click(screen.getByRole('button', { name: /가상 김이비/ }))
  await user.selectOptions(await screen.findByLabelText('지금 보고 있는 계정'), [optionLabel])
}

describe('doctor answer flow', () => {
  beforeEach(() => {
    window.location.hash = '#/home'
  })

  it('진료 이력 한정 글은 그 의료기관 의사에게만 보인다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await viewAs(user, 'doc-han-ent')
    expect(screen.getByText('지난번 처방 이후 경과를 여쭙습니다')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('지금 보고 있는 계정'), ['doc-skin-derm'])
    expect(screen.queryByText('지난번 처방 이후 경과를 여쭙습니다')).not.toBeInTheDocument()
  })

  it('진료과 한정 글은 다른 과 의사에게 보이지 않는다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await viewAs(user, 'doc-forest-im')
    expect(screen.getByText('식후 속쓰림이 반복됩니다')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('지금 보고 있는 계정'), ['doc-inha-psy'])
    expect(screen.queryByText('식후 속쓰림이 반복됩니다')).not.toBeInTheDocument()
  })

  it('답변을 등록하면 환자 화면에 나타난다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await viewAs(user, 'doc-inha-psy')
    await user.click(screen.getByRole('button', { name: '두 달째 잠이 안 옵니다 답변하기' }))

    await user.type(
      screen.getByLabelText('답변'),
      '잠들기까지 걸린 시간을 2주만 기록해 보시면 좋겠습니다.',
    )
    await user.click(screen.getByRole('button', { name: '답변 등록' }))

    expect(screen.getByRole('heading', { name: '받은 질문' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '환자 화면' }))
    window.location.hash = '#/questions/q-sleep'

    expect(await screen.findByRole('heading', { name: '의사 답변 2' })).toBeInTheDocument()
    expect(
      screen.getByText('잠들기까지 걸린 시간을 2주만 기록해 보시면 좋겠습니다.'),
    ).toBeInTheDocument()
  })

  it('안 보이는 질문에 직접 접근하면 막는다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await viewAs(user, 'doc-skin-derm')
    window.location.hash = '#/doctor/questions/q-followup'

    expect(await screen.findByText('이 계정에는 보이지 않는 질문입니다.')).toBeInTheDocument()
  })
})
