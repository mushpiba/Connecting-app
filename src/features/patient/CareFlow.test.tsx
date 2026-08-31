import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '../../App'

describe('care tab', () => {
  beforeEach(() => {
    window.location.hash = '#/care'
  })

  it('세 구역을 급한 순으로 세운다', () => {
    render(<App />)

    const headings = screen
      .getAllByRole('heading', { level: 2 })
      .map((heading) => heading.textContent)

    expect(headings).toEqual(['예정된 예약·진료방', '내가 진료봤던 곳', '주변 의원'])
  })

  it('아무것도 없는 신규 사용자에게도 1·2구역 자리를 남긴다', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: '예정된 진료가 없어요' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '아직 등록된 곳이 없어요' })).toBeInTheDocument()
    expect(screen.getAllByText(/가상 한빛이비인후과의원/).length).toBeGreaterThan(0)
  })

  it('세 구역이 각각 무엇을 위에 올리는지 적는다', () => {
    render(<App />)

    expect(screen.getByText(/진료방이 열린 것을 맨 위에/)).toBeInTheDocument()
    expect(screen.getByText(/마지막 진료일이 가까운 순서로 놓습니다/)).toBeInTheDocument()
    expect(screen.getByText(/노출 순서를 팔지 않습니다/)).toBeInTheDocument()
  })

  it('직접 등록한 곳은 검증되지 않았다고 화면이 말한다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '다니는 곳 추가' }))
    await user.type(screen.getByLabelText('의료기관 이름'), '가상 동네의원')
    await user.type(screen.getByLabelText('마지막 진료일'), '2026-05-02')
    await user.click(screen.getByRole('button', { name: '추가' }))

    expect(screen.getByRole('heading', { name: '내가 직접 적은 곳' })).toBeInTheDocument()
    expect(screen.getByText('가상 동네의원')).toBeInTheDocument()
    expect(
      screen.getByText(
        '내가 적은 내용이며 MediVU가 확인하지 않았습니다. 이 기록으로는 비대면 재진 자격이 생기지 않습니다.',
      ),
    ).toBeInTheDocument()
  })

  it('직접 등록한 곳을 지울 때 확인을 한 번 받는다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '다니는 곳 추가' }))
    await user.type(screen.getByLabelText('의료기관 이름'), '가상 동네의원')
    await user.type(screen.getByLabelText('마지막 진료일'), '2026-05-02')
    await user.click(screen.getByRole('button', { name: '추가' }))

    await user.click(screen.getByRole('button', { name: '지우기' }))
    expect(screen.getByRole('alert')).toHaveTextContent('되돌릴 수 없습니다')

    await user.click(within(screen.getByRole('alert')).getByRole('button', { name: '지우기' }))
    expect(screen.queryByText('가상 동네의원')).not.toBeInTheDocument()
  })

  it('주변 의원은 막힌 사유를 그대로 적는다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: '초진 비대면 가능' }))

    expect(screen.queryByText(/병원급은 희귀질환 등 예외 사유에만/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: '전체' }))

    expect(screen.getByText(/병원급은 희귀질환 등 예외 사유에만/)).toBeInTheDocument()
  })

  it('의료기관 연계 불러오기는 자리만 남기고 만들지 않는다', () => {
    render(<App />)

    expect(screen.getByText(/의료기관 연계로 진료 이력을 「불러오기」는 아직 없습니다/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /불러오기/ })).not.toBeInTheDocument()
  })
})
