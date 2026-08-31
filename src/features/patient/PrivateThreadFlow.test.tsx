import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '../../App'

type User = ReturnType<typeof userEvent.setup>

const DOCTOR = '가상 김이비'

/**
 * 환자 화면의 그 답변 카드 아래 자리. 답변마다 하나씩 있으므로 이름으로 고른다.
 * 주소를 바꾼 직후에는 아직 안 그려져 있으므로 기다렸다 잡는다.
 */
function patientPanel(open: boolean) {
  return screen.findByRole('region', {
    name: open ? `${DOCTOR} 의사와의 비공개 덧붙임` : `${DOCTOR} 의사에게 비공개로 묻기`,
  })
}

async function openStory() {
  window.location.hash = '#/questions/q-nose'
  await screen.findByRole('heading', { name: '2주째 콧물과 코막힘이 안 나아요' })
}

async function openThread(user: User) {
  await openStory()
  await user.click(within(await patientPanel(false)).getByRole('button', { name: '비공개로 더 묻기' }))
}

async function askPrivately(user: User, body: string) {
  await openStory()
  const panel = await patientPanel(true)
  await user.type(within(panel).getByLabelText('비공개로 묻기'), body)
  await user.click(within(panel).getByRole('button', { name: '보내기' }))
}

/** 의사로 갈아탄다. 두 정체성을 오가려면 `/expert`를 거친다. */
async function becomeDoctor(user: User) {
  window.location.hash = '#/expert'
  await user.click(await screen.findByRole('button', { name: new RegExp(DOCTOR) }))
}

async function replyPrivately(user: User, body: string) {
  window.location.hash = '#/doctor/questions/q-nose'
  await user.type(await screen.findByLabelText('비공개 회신'), body)
  await user.click(screen.getByRole('button', { name: '회신 등록' }))
}

async function backToPatient(user: User) {
  await user.click(screen.getByRole('button', { name: '환자 화면' }))
}

describe('비공개 덧붙임 · 구조 강제', () => {
  beforeEach(() => {
    window.location.hash = '#/home'
  })

  it('답변이 없으면 비공개 경로 자체가 없다 — 붙을 카드가 없다', async () => {
    render(<App />)
    window.location.hash = '#/questions/q-followup'

    expect(await screen.findByText(/아직 답변이 없습니다/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '비공개로 더 묻기' })).not.toBeInTheDocument()
  })

  it('남의 사연에서는 대화의 존재 자체가 보이지 않는다', async () => {
    render(<App />)
    window.location.hash = '#/questions/q-rash'

    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '비공개로 더 묻기' })).not.toBeInTheDocument()
  })

  it('의사 화면에는 대화를 여는 수단이 없다 — 환자가 열기 전에는 자리도 없다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await becomeDoctor(user)
    window.location.hash = '#/doctor/questions/q-nose'

    expect(await screen.findByLabelText('답변')).toBeInTheDocument()
    expect(screen.queryByText('비공개 덧붙임')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('비공개 회신')).not.toBeInTheDocument()
  })

  it('환자가 열고 물으면 의사 차례가 되고 환자는 연달아 못 묻는다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await openThread(user)
    expect(
      within(await patientPanel(true)).getByText(/남은 왕복 3회 · 한 번에 500자까지/),
    ).toBeInTheDocument()

    await askPrivately(user, '알려주신 방법을 2주 해봤는데 그대로면 어떻게 하나요?')

    const panel = await patientPanel(true)
    expect(within(panel).getByText(/남은 왕복 2회/)).toBeInTheDocument()
    expect(within(panel).queryByLabelText('비공개로 묻기')).not.toBeInTheDocument()
    expect(within(panel).getByText(/의사 회신을 기다리는 중입니다/)).toBeInTheDocument()
  })

  it('열자마자 경계를 적고 진료 전환을 상시 낸다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await openThread(user)

    const panel = await patientPanel(true)
    expect(within(panel).getByText(/여기는 진료가 아닙니다/)).toBeInTheDocument()
    expect(within(panel).getByRole('button', { name: '진료가 필요합니다' })).toBeInTheDocument()
  })

  it('진료 전환은 프로필로 한 단계 경유한다 — 예약으로 바로 보내지 않는다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await openThread(user)
    await user.click(
      within(await patientPanel(true)).getByRole('button', { name: '진료가 필요합니다' }),
    )

    expect(await screen.findByRole('heading', { name: DOCTOR, level: 1 })).toBeInTheDocument()
  })

  it('의사 회신마다 고정 고지가 붙는다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await openThread(user)
    await askPrivately(user, '2주 뒤에도 그대로면 어떻게 해야 하나요?')
    await becomeDoctor(user)
    await replyPrivately(user, '한쪽 코만 계속 막히는지 살펴보시고 그대로면 진료를 받아 보세요.')

    // 의사 화면에도, 환자 화면에도 같은 고지가 있고 지우는 수단이 없다.
    expect(
      screen.getByText(/이 글은 진료가 아니며 진단·처방이 아닙니다/),
    ).toBeInTheDocument()

    await backToPatient(user)
    await openStory()
    expect(
      within(await patientPanel(true)).getByText(/이 글은 진료가 아니며 진단·처방이 아닙니다/),
    ).toBeInTheDocument()
  })

  it('3왕복을 다 쓰면 입력 칸이 사라지고 완결조로 닫힌다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await openThread(user)
    for (const round of [1, 2, 3]) {
      await askPrivately(user, `${round}번째로 여쭙습니다. 언제까지 지켜봐도 될까요?`)
      await becomeDoctor(user)
      await replyPrivately(user, `${round}번째 회신입니다. 경과를 지켜보시고 심해지면 진료를 받으세요.`)
      await backToPatient(user)
    }

    await openStory()
    const panel = await patientPanel(true)
    expect(within(panel).getByText(/남은 왕복 0회/)).toBeInTheDocument()
    expect(within(panel).queryByLabelText('비공개로 묻기')).not.toBeInTheDocument()
    expect(
      within(panel).getByText(/비공개로 주고받을 수 있는 3왕복을 다 썼습니다/),
    ).toBeInTheDocument()
    // 닫힘이 차단조가 아니라 완결조다. 「더 쓰려면」 같은 우회로를 두지 않는다.
    expect(within(panel).getByRole('button', { name: '진료가 필요합니다' })).toBeInTheDocument()
  })
})

describe('표현 필터 · 지시는 막고 지식은 통과시킨다', () => {
  beforeEach(() => {
    window.location.hash = '#/home'
  })

  it('검사 지시는 전송되지 않고 걸린 자리를 알려 준다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await openThread(user)
    await askPrivately(user, '검사를 꼭 받아야 하는지 궁금합니다.')
    await becomeDoctor(user)
    await replyPrivately(user, '내시경 받으세요.')

    const block = await screen.findByTestId('expression-filter-block')
    expect(within(block).getByText('PT-4')).toBeInTheDocument()
    expect(within(block).getByText(/검사 지시로 읽힙니다/)).toBeInTheDocument()
    // 막혔으므로 말풍선이 늘지 않는다. 쓰던 글은 지우지 않는다.
    expect(screen.queryAllByTestId('private-bubble-doctor')).toHaveLength(0)
    expect(screen.getByLabelText('비공개 회신')).toHaveValue('내시경 받으세요.')
  })

  it('같은 검사명이라도 설명이면 통과한다 — 막는 것은 지시이지 지식이 아니다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await openThread(user)
    await askPrivately(user, '검사를 꼭 받아야 하는지 궁금합니다.')
    await becomeDoctor(user)
    await replyPrivately(user, '이런 경우 내시경으로 봐야 하는 경우가 많습니다.')

    expect(screen.queryByTestId('expression-filter-block')).not.toBeInTheDocument()
    expect(
      screen.getByText('이런 경우 내시경으로 봐야 하는 경우가 많습니다.'),
    ).toBeInTheDocument()
  })

  it('공개 답변에도 같은 규칙이 걸린다 — 의료기관 유치는 C-3이 이미 요구한다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await becomeDoctor(user)
    window.location.hash = '#/doctor/questions/q-sleep'
    await user.type(await screen.findByLabelText('답변'), '우리 병원으로 오세요.')
    await user.click(screen.getByRole('button', { name: '답변 등록' }))

    const block = await screen.findByTestId('expression-filter-block')
    expect(within(block).getByText('PT-5')).toBeInTheDocument()
  })
})

describe('도착을 알리는 자리', () => {
  beforeEach(() => {
    window.location.hash = '#/home'
  })

  it('Q-7 · /news 에 「비공개 회신」 태그로 오고 본문은 싣지 않는다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await openThread(user)
    await askPrivately(user, '언제까지 기다려도 될까요?')
    await becomeDoctor(user)
    await replyPrivately(user, '2주 정도 보시고 그대로면 진료를 받아 보세요.')
    await backToPatient(user)

    window.location.hash = '#/news'
    expect(await screen.findByText('비공개 회신')).toBeInTheDocument()
    expect(screen.getByText(`${DOCTOR} 의사가 비공개로 회신했어요`)).toBeInTheDocument()
    expect(screen.queryByText(/2주 정도 보시고/)).not.toBeInTheDocument()
  })

  it('Q-9 · /doctor/home 에 회신 대기 한 줄이 서고 그 사연으로 보낸다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await openThread(user)
    await askPrivately(user, '언제까지 기다려도 될까요?')
    await becomeDoctor(user)

    const line = await screen.findByRole('button', { name: /비공개 회신 대기 1건/ })
    await user.click(line)

    expect(await screen.findByLabelText('비공개 회신')).toBeInTheDocument()
  })

  it('내 차례가 아니면 대기 줄이 서지 않는다 — 말 걸 수 있는 환자 목록이 아니다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await becomeDoctor(user)

    expect(screen.queryByText(/비공개 회신 대기/)).not.toBeInTheDocument()
  })
})
