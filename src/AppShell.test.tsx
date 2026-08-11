import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'

describe('patient app shell', () => {
  beforeEach(() => {
    window.location.hash = '#/home'
  })

  it('환자 화면에 다섯 개의 주요 탭을 표시한다', () => {
    render(<App />)

    const navigation = screen.getByRole('navigation', { name: '주요 화면' })
    expect(within(navigation).getAllByRole('button').map((button) => button.textContent)).toEqual([
      '홈',
      '사연',
      'Q',
      '지도',
      'MY',
    ])
  })

  it('내소식은 헤더 아이콘으로 들어간다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '내소식' }))

    expect(screen.getByRole('heading', { name: '내소식' })).toBeInTheDocument()
  })

  it('지도 탭에서 내 주변 병원을 연다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '지도' }))

    expect(screen.getByRole('heading', { name: '내 주변 병원' })).toBeInTheDocument()
  })

  it('데스크톱 보기 모드를 앱 미리보기로 전환한다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '앱 미리보기' }))

    expect(screen.getByTestId('app-viewport')).toHaveAttribute('data-preview-mode', 'app')
    expect(screen.getByRole('button', { name: '앱 미리보기' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('expert 안내를 거쳐 데모 의사 화면으로 들어간다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'expert' }))
    expect(screen.getByRole('heading', { name: '어느 의사로 들어갈까요' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /가상 김이비/ }))
    expect(screen.getByRole('heading', { name: '받은 질문' })).toBeInTheDocument()
  })
})
