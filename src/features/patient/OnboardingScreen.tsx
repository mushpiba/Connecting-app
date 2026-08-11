import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export const ONBOARDING_COMPLETE_KEY = 'medivu.onboarding.complete.v1'

interface OnboardingScreenProps {
  onComplete: () => void
}

interface OnboardingLocationState {
  returnTo?: string
}

const slides = [
  {
    eyebrow: 'STEP 1 · 사연 작성',
    title: '의료 고민을 사연으로 시작하세요',
    body: '증상이 언제부터 어떻게 불편했는지 적으면 필요한 내용을 차근차근 정리해 드립니다.',
    symbol: 'Q',
  },
  {
    eyebrow: 'STEP 2 · 전문의 답변',
    title: '관련 분야 의사의 답변을 모아보세요',
    body: '공개 범위를 직접 고르고, 내 사연에 도착한 답변은 내소식에서 한 번에 확인합니다.',
    symbol: 'A',
  },
  {
    eyebrow: 'STEP 3 · 진료 연결',
    title: '필요할 때 진료로 이어가세요',
    body: '답변한 의사의 정보와 진료시간을 확인하고 대면 또는 비대면 진료 가능 여부를 살펴봅니다.',
    symbol: '+',
  },
] as const

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [index, setIndex] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()
  const slide = slides[index]
  const returnTo = (location.state as OnboardingLocationState | null)?.returnTo ?? '/home'

  const complete = () => {
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true')
    onComplete()
    navigate(returnTo, { replace: true })
  }

  return (
    <main className="onboarding-screen">
      <div className="onboarding-topbar">
        <strong>MediVU</strong>
        <button type="button" onClick={complete}>
          건너뛰기
        </button>
      </div>

      <section className="onboarding-slide" aria-live="polite">
        <div className="onboarding-symbol" aria-hidden="true">
          {slide.symbol}
        </div>
        <p className="eyebrow">{slide.eyebrow}</p>
        <h1>{slide.title}</h1>
        <p>{slide.body}</p>
      </section>

      <div className="onboarding-footer">
        <div className="onboarding-dots" aria-label={`${index + 1} / ${slides.length}`}>
          {slides.map((item, dotIndex) => (
            <span key={item.eyebrow} className={dotIndex === index ? 'is-active' : ''} />
          ))}
        </div>
        {index < slides.length - 1 ? (
          <button type="button" className="primary-cta" onClick={() => setIndex(index + 1)}>
            다음
          </button>
        ) : (
          <button type="button" className="primary-cta" onClick={complete}>
            MediVU 시작하기
          </button>
        )}
        <p>이 서비스는 진단을 제공하지 않습니다. 응급 증상은 119 또는 응급실을 이용하세요.</p>
      </div>
    </main>
  )
}
