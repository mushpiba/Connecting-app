import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '../../App'

async function viewAs(user: ReturnType<typeof userEvent.setup>, optionLabel: string) {
  await user.click(screen.getByRole('button', { name: 'expert' }))
  await user.click(screen.getByRole('button', { name: /가상 김이비/ }))
  await user.click(screen.getByRole('button', { name: '받은 질문' }))
  await user.selectOptions(await screen.findByLabelText('지금 보고 있는 계정'), [optionLabel])
}

/** 목록을 거치지 않고 같은 사연에 한 건 더 쓴다. 상한을 소진시키는 데 쓴다. */
async function answerOnce(user: ReturnType<typeof userEvent.setup>, body: string) {
  window.location.hash = '#/doctor/questions/q-sleep'
  await user.type(await screen.findByLabelText('답변'), body)
  await user.click(screen.getByRole('button', { name: '답변 등록' }))
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

  it('진료과 한정 글은 사연 모음에서 그 과 의사에게만 보인다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await viewAs(user, 'doc-forest-im')
    await user.click(screen.getByRole('button', { name: '사연' }))
    expect(screen.getByText('식후 속쓰림이 반복됩니다')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '받은 질문' }))
    await user.selectOptions(screen.getByLabelText('지금 보고 있는 계정'), ['doc-inha-psy'])
    await user.click(screen.getByRole('button', { name: '사연' }))
    expect(screen.queryByText('식후 속쓰림이 반복됩니다')).not.toBeInTheDocument()
  })

  it('답변을 등록하면 환자 화면에 나타난다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await viewAs(user, 'doc-inha-psy')
    await user.click(screen.getByRole('button', { name: '사연' }))
    await user.click(screen.getByRole('button', { name: '두 달째 잠이 안 옵니다 답변하기' }))

    await user.type(
      screen.getByLabelText('답변'),
      '잠들기까지 걸린 시간을 2주만 기록해 보시면 좋겠습니다.',
    )
    await user.click(screen.getByRole('button', { name: '답변 등록' }))

    expect(screen.getByRole('heading', { name: '직접 받은 질문' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '환자 화면' }))
    window.location.hash = '#/questions/q-sleep'

    expect(await screen.findByRole('heading', { name: '의사 답변 2' })).toBeInTheDocument()
    expect(
      screen.getByText('잠들기까지 걸린 시간을 2주만 기록해 보시면 좋겠습니다.'),
    ).toBeInTheDocument()
  })

  /** 상한은 감추는 제약이 아니라 드러내는 자원이다 (D-8). */
  it('받은 질문 위에 오늘 남은 답변과 채워지는 시점이 함께 선다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await viewAs(user, 'doc-inha-psy')

    expect(screen.getByText('오늘 남은 답변 5회')).toBeInTheDocument()
    expect(screen.getByText('매일 자정에 5회로 다시 채워집니다')).toBeInTheDocument()
  })

  it('답변을 등록하면 남은 횟수가 줄어든다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await viewAs(user, 'doc-inha-psy')
    await answerOnce(user, '기록을 2주만 적어 오시면 좋겠습니다.')

    expect(await screen.findByText('오늘 남은 답변 4회')).toBeInTheDocument()
  })

  it('다 쓰면 차단이 아니라 완결로 말하고 폼을 읽기 전용으로 둔다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await viewAs(user, 'doc-inha-psy')
    for (let count = 0; count < 5; count += 1) {
      await answerOnce(user, `오늘 ${count}번째로 적는 답변입니다.`)
    }

    expect(await screen.findByText('오늘 답변 5회를 다 썼습니다')).toBeInTheDocument()
    expect(screen.getByText('내일 자정에 다시 채워집니다. 오늘 할 일은 끝났습니다.')).toBeInTheDocument()

    window.location.hash = '#/doctor/questions/q-sleep'
    expect(await screen.findByLabelText('답변')).toHaveAttribute('readonly')
    expect(screen.getByRole('button', { name: '답변 등록' })).toBeDisabled()
  })

  it('안 보이는 질문에 직접 접근하면 막는다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await viewAs(user, 'doc-skin-derm')
    window.location.hash = '#/doctor/questions/q-followup'

    expect(await screen.findByText('이 계정에는 보이지 않는 질문입니다.')).toBeInTheDocument()
  })
})
