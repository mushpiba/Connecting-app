import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '../../App'

describe('MY settings demo flows', () => {
  it('주소 설정을 세션에 저장한다', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/me'
    render(<App />)

    await user.click(screen.getByRole('button', { name: '주소 설정' }))
    await user.selectOptions(screen.getByLabelText('기본 지역'), '서울 성동구')
    await user.type(screen.getByLabelText('상세 주소 별칭 (선택)'), '회사')
    await user.click(screen.getByRole('button', { name: '주소 저장' }))

    expect(within(screen.getByRole('main')).getByRole('status')).toHaveTextContent('주소를 저장했습니다.')
  })

  it('별칭 없이 지역만 골라도 진료 준비가 채워진다', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/me'
    render(<App />)

    await user.click(screen.getByRole('button', { name: '주소 설정' }))
    await user.selectOptions(screen.getByLabelText('기본 지역'), '서울 성동구')
    await user.click(screen.getByRole('button', { name: '주소 저장' }))
    await user.click(screen.getByRole('button', { name: '← MY로 돌아가기' }))

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25')
    expect(screen.getByText('주소 설정', { selector: 'li' })).toHaveClass('is-done')
  })

  it('마스킹된 데모 결제수단을 선택한다', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/me'
    render(<App />)

    await user.click(screen.getByRole('button', { name: '결제수단 설정' }))
    await user.click(screen.getByRole('radio', { name: '하나카드 •••• 0616' }))
    await user.click(screen.getByRole('button', { name: '결제수단 저장' }))

    expect(within(screen.getByRole('main')).getByRole('status')).toHaveTextContent('결제수단을 저장했습니다.')
  })

  it('답변과 예약 알림을 각각 설정한다', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/me'
    render(<App />)

    await user.click(screen.getByRole('button', { name: '알림 설정' }))
    await user.click(screen.getByRole('checkbox', { name: '답변 도착 알림' }))
    await user.click(screen.getByRole('button', { name: '알림 설정 저장' }))

    expect(within(screen.getByRole('main')).getByRole('status')).toHaveTextContent('알림 설정을 저장했습니다.')
  })

  it('질문 공개 범위와 프로필 표시를 설정한다', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/me'
    render(<App />)

    await user.click(screen.getByRole('button', { name: '개인정보 설정' }))
    await user.click(screen.getByRole('radio', { name: '관련 진료과 의사에게만' }))
    await user.click(screen.getByRole('checkbox', { name: '프로필 이름 표시' }))
    await user.click(screen.getByRole('button', { name: '개인정보 설정 저장' }))

    expect(within(screen.getByRole('main')).getByRole('status')).toHaveTextContent('개인정보 설정을 저장했습니다.')
  })

  it('아직 전달한 예약 희망 시간이 없으면 빈 상태를 보여준다', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/me'
    render(<App />)

    await user.click(screen.getByRole('button', { name: '예약 내역' }))

    expect(screen.getByRole('heading', { name: '예약 내역' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '전달한 희망 시간이 없어요' })).toBeInTheDocument()
  })

  it('전달한 예약 희망 시간을 예약 내역에서 확인한다', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/booking/doc-skin-derm'
    render(<App />)

    await user.click(screen.getByRole('button', { name: '다음' }))
    await user.click(screen.getByRole('button', { name: '10:30' }))
    await user.click(screen.getByRole('button', { name: '다음' }))
    await user.click(screen.getByRole('button', { name: '희망 시간 전달' }))
    window.location.hash = '#/me/appointments'

    expect(await screen.findByRole('heading', { name: '예약 내역' })).toBeInTheDocument()
    expect(screen.getByText(/10:30/)).toBeInTheDocument()
    expect(screen.getByText(/예약 확정 전/)).toBeInTheDocument()
  })
})
