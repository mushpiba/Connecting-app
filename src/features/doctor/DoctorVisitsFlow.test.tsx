import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '../../App'

type User = ReturnType<typeof userEvent.setup>

/** 환자로 신청을 하나 만든다. 신청이 없으면 볼 상태 전이도 없다. */
async function requestEncounter(user: User) {
  window.location.hash = '#/me/precheck'
  await user.selectOptions(await screen.findByLabelText('사는 지역'), '인천 미추홀구')
  await user.click(screen.getByRole('checkbox', { name: /본인 확인을 마쳤습니다/ }))
  await user.click(screen.getByRole('checkbox', { name: '위 조건을 확인했습니다' }))
  await user.click(screen.getByRole('button', { name: '사전 확인 마치기' }))

  window.location.hash = '#/doctors/doc-han-ent'
  await user.click(await screen.findByRole('button', { name: '비대면 진료 신청' }))
}

/** 의사 화면에 들어가려면 `/expert`를 거친다. */
async function enterDoctorVisits(user: User) {
  window.location.hash = '#/expert'
  await user.click(await screen.findByRole('button', { name: /가상 김이비/ }))
  await user.click(await screen.findByRole('button', { name: '진료' }))
}

describe('doctor visits flow', () => {
  beforeEach(() => {
    window.location.hash = '#/home'
  })

  it('신청이 들어오면 확인·열기·거절 셋을 낸다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await requestEncounter(user)
    await enterDoctorVisits(user)

    expect(await screen.findByText('2주째 콧물과 코막힘이 안 나아요')).toBeInTheDocument()
    expect(screen.getByText('신청 도착')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '화상 진료방 열기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '이번엔 어렵습니다' })).toBeInTheDocument()
  })

  it('확인하면 환자 추적의 2단계가 채워진다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await requestEncounter(user)
    await enterDoctorVisits(user)
    await user.click(await screen.findByRole('button', { name: '확인' }))

    expect(screen.getByText('확인함')).toBeInTheDocument()
    // 확인은 한 번뿐이다. 확인한 신청을 또 확인할 수 없다.
    expect(screen.queryByRole('button', { name: '확인' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '환자 화면' }))
    window.location.hash = '#/care'

    expect(await screen.findByText('의사가 신청을 확인했습니다')).toBeInTheDocument()
  })

  it('진료방을 열면 상태가 먼저 바뀌고 진료방으로 넘어간다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await requestEncounter(user)
    await enterDoctorVisits(user)
    await user.click(await screen.findByRole('button', { name: '화상 진료방 열기' }))

    expect(window.location.hash).toContain('/doctor/visit/e-q-nose-doc-han-ent')

    window.location.hash = '#/doctor/visits'
    expect(await screen.findByText('진행 중')).toBeInTheDocument()
  })

  /** G-10의 핵심. 끝난 진료가 홈에 남아 있으면 그것이 F-6이 만든 버그다. */
  it('진료를 마치면 의사 목록과 환자 홈에서 함께 내려간다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await requestEncounter(user)
    await enterDoctorVisits(user)
    await user.click(await screen.findByRole('button', { name: '화상 진료방 열기' }))

    window.location.hash = '#/doctor/visits'
    await user.click(await screen.findByRole('button', { name: '진료 마침' }))

    expect(await screen.findByText('들어온 신청이 없어요')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '환자 화면' }))
    window.location.hash = '#/home'

    expect(
      await screen.findByRole('heading', { name: '사연', level: 1 }),
    ).toBeInTheDocument()
    expect(screen.queryByText('진료방이 열렸습니다 · 지금 들어가세요')).not.toBeInTheDocument()
  })

  it('열려 있는 동안에는 환자 홈이 진료방을 가리킨다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await requestEncounter(user)
    await enterDoctorVisits(user)
    await user.click(await screen.findByRole('button', { name: '화상 진료방 열기' }))

    window.location.hash = '#/doctor/visits'
    await user.click(await screen.findByRole('button', { name: '환자 화면' }))
    window.location.hash = '#/home'

    expect(await screen.findByText('진료방이 열렸습니다 · 지금 들어가세요')).toBeInTheDocument()
  })

  it('거절은 한 번 되묻고 나서만 나간다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await requestEncounter(user)
    await enterDoctorVisits(user)
    await user.click(await screen.findByRole('button', { name: '이번엔 어렵습니다' }))

    expect(screen.getByRole('alert')).toHaveTextContent('되돌릴 수 없습니다')

    await user.click(screen.getByRole('button', { name: '그대로 두기' }))
    expect(screen.getByText('신청 도착')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '이번엔 어렵습니다' }))
    await user.click(screen.getByRole('button', { name: '거절하기' }))

    expect(await screen.findByText('들어온 신청이 없어요')).toBeInTheDocument()
  })

  /** 거절이 환자 화면에서 사라지면 환자는 자기 신청이 어떻게 됐는지 모른다. */
  it('거절된 신청은 환자 진료 탭에 이유와 함께 남는다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await requestEncounter(user)
    await enterDoctorVisits(user)
    await user.click(await screen.findByRole('button', { name: '이번엔 어렵습니다' }))
    await user.click(screen.getByRole('button', { name: '거절하기' }))

    await user.click(screen.getByRole('button', { name: '환자 화면' }))
    window.location.hash = '#/care'

    expect(await screen.findByText('이번 신청은 받지 못했습니다')).toBeInTheDocument()
    expect(screen.getByText(/대면 진료를 예약하거나 다른 의사에게 물어볼 수 있습니다/)).toBeInTheDocument()
  })

  it('거절된 뒤에는 같은 의사에게 다시 신청할 수 있다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await requestEncounter(user)
    await enterDoctorVisits(user)
    await user.click(await screen.findByRole('button', { name: '이번엔 어렵습니다' }))
    await user.click(screen.getByRole('button', { name: '거절하기' }))

    await user.click(screen.getByRole('button', { name: '환자 화면' }))
    window.location.hash = '#/doctors/doc-han-ent'

    const button = await screen.findByRole('button', { name: '비대면 진료 신청' })
    expect(button).toBeEnabled()

    await user.click(button)
    expect(screen.getByRole('button', { name: '비대면 진료 신청함' })).toBeDisabled()
  })
})
