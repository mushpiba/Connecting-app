import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InstallCard } from './InstallCard'

function fireInstallPrompt(outcome: 'accepted' | 'dismissed' = 'accepted') {
  const event = new Event('beforeinstallprompt') as Event & {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  }
  event.prompt = () => Promise.resolve()
  event.userChoice = Promise.resolve({ outcome })
  act(() => {
    window.dispatchEvent(event)
  })
  return event
}

describe('InstallCard', () => {
  it('설치 조건을 못 채우면 아무것도 그리지 않는다', () => {
    render(<InstallCard />)

    expect(screen.queryByRole('heading', { name: '앱으로 설치하기' })).not.toBeInTheDocument()
  })

  it('브라우저가 설치 가능하다고 알리면 안내를 띄운다', () => {
    render(<InstallCard />)
    fireInstallPrompt()

    expect(screen.getByRole('heading', { name: '앱으로 설치하기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '설치' })).toBeInTheDocument()
  })

  it('설치를 마치면 안내를 거둔다', async () => {
    const user = userEvent.setup()
    render(<InstallCard />)
    fireInstallPrompt()

    await user.click(screen.getByRole('button', { name: '설치' }))

    expect(screen.queryByRole('button', { name: '설치' })).not.toBeInTheDocument()
  })

  it('나중에를 누르면 다시 띄우지 않는다', async () => {
    const user = userEvent.setup()
    render(<InstallCard />)
    fireInstallPrompt()

    await user.click(screen.getByRole('button', { name: '나중에' }))
    fireInstallPrompt()

    expect(screen.queryByRole('heading', { name: '앱으로 설치하기' })).not.toBeInTheDocument()
  })
})
