import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '../../App'

async function completePrecheck(
  user: ReturnType<typeof userEvent.setup>,
  region = '인천 미추홀구',
) {
  window.location.hash = '#/me'
  await user.selectOptions(await screen.findByLabelText('사는 지역'), region)
  await user.click(screen.getByRole('checkbox', { name: /본인 확인을 마쳤습니다/ }))
  await user.click(screen.getByRole('checkbox', { name: '위 조건을 확인했습니다' }))
  await user.click(screen.getByRole('button', { name: '사전 확인 마치기' }))
}

describe('telemedicine request flow', () => {
  beforeEach(() => {
    window.location.hash = '#/doctors/doc-han-ent'
  })

  it('사전 확인 전에는 신청 버튼이 보이되 비활성이다', () => {
    render(<App />)

    const button = screen.getByRole('button', { name: '비대면 진료 신청' })
    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
    expect(screen.getByText('비대면 사전 확인을 먼저 마쳐 주세요.')).toBeInTheDocument()
  })

  it('대면 예약은 언제나 열려 있다', () => {
    render(<App />)

    expect(screen.getByRole('button', { name: /초진 대면 진료 예약/ })).toBeEnabled()
  })

  it('사전 확인을 마치면 재진 환자는 신청할 수 있다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await completePrecheck(user)
    window.location.hash = '#/doctors/doc-han-ent'

    const button = await screen.findByRole('button', { name: '비대면 진료 신청' })
    expect(button).toBeEnabled()

    await user.click(button)
    expect(screen.getByRole('button', { name: '비대면 진료 신청함' })).toBeDisabled()
  })

  it('비대면을 운영하지 않는 의료기관이면 그 사유를 보여준다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await completePrecheck(user)
    window.location.hash = '#/doctors/doc-skin-derm'

    expect(await screen.findByRole('button', { name: '비대면 진료 신청' })).toBeDisabled()
    expect(document.getElementById('gate-reason')).toHaveTextContent(
      '비대면 진료를 운영하지 않습니다',
    )
    expect(screen.queryByText('비대면 가능')).not.toBeInTheDocument()
  })

  it('막히면 대면 진료 안내문을 함께 보여준다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await completePrecheck(user)
    window.location.hash = '#/doctors/doc-skin-derm'

    expect(await screen.findByRole('heading', { name: '대면 진료 안내' })).toBeInTheDocument()
  })

  it('비대면을 운영하는 의료기관 프로필에는 비대면 가능 표시가 있다', () => {
    render(<App />)

    expect(screen.getByText('비대면 가능')).toBeInTheDocument()
  })
})
