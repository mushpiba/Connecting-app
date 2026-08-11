import { useEffect, useState } from 'react'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone(): boolean {
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(display-mode: standalone)').matches
}

/**
 * 홈 화면에 설치 안내를 띄운다.
 *
 * Chrome은 설치 조건을 채웠을 때만 beforeinstallprompt를 쏜다. 그래서 이 카드가
 * 보이는 것 자체가 설치 가능하다는 신호다. 조건을 못 채우면 조용히 사라진다.
 * iOS Safari는 이 이벤트가 없어 수동 안내만 남긴다.
 */
export function InstallCard() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault()
      setPrompt(event as InstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed || dismissed || isStandalone() || prompt === null) return null

  const install = async () => {
    await prompt.prompt()
    const choice = await prompt.userChoice
    if (choice.outcome === 'accepted') setInstalled(true)
    setPrompt(null)
  }

  return (
    <section className="install-card" aria-labelledby="install-heading">
      <div className="install-copy">
        <h2 id="install-heading">앱으로 설치하기</h2>
        <p>홈 화면에 추가하면 주소창 없이 앱처럼 열립니다. 스토어 설치가 아닙니다.</p>
      </div>
      <div className="install-actions">
        <button type="button" className="primary-cta" onClick={install}>
          설치
        </button>
        <button type="button" className="text-button" onClick={() => setDismissed(true)}>
          나중에
        </button>
      </div>
    </section>
  )
}
