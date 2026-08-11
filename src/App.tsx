import { useState } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppHeader } from './components/AppHeader'
import { BottomNav } from './components/BottomNav'
import { AskScreen } from './features/patient/AskScreen'
import { BoardScreen } from './features/patient/BoardScreen'
import { BookingScreen } from './features/patient/BookingScreen'
import { DoctorProfileScreen } from './features/patient/DoctorProfileScreen'
import { HomeScreen } from './features/patient/HomeScreen'
import { MyPageScreen } from './features/patient/MyPageScreen'
import {
  ONBOARDING_COMPLETE_KEY,
  OnboardingScreen,
} from './features/patient/OnboardingScreen'
import { QuestionDetailScreen } from './features/patient/QuestionDetailScreen'
import { DoctorAnswerScreen } from './features/doctor/DoctorAnswerScreen'
import { DoctorInboxScreen } from './features/doctor/DoctorInboxScreen'
import { CommunityProvider } from './state/CommunityContext'

function AppRoutes() {
  const location = useLocation()
  const [onboardingComplete, setOnboardingComplete] = useState(
    () => localStorage.getItem(ONBOARDING_COMPLETE_KEY) === 'true',
  )

  if (!onboardingComplete && location.pathname !== '/onboarding') {
    return <Navigate replace to="/onboarding" state={{ returnTo: location.pathname }} />
  }

  if (location.pathname === '/onboarding') {
    return (
      <Routes>
        <Route
          path="/onboarding"
          element={<OnboardingScreen onComplete={() => setOnboardingComplete(true)} />}
        />
      </Routes>
    )
  }

  return (
    <div className="app-root">
      <AppHeader />
      <div className="app-body">
        <BottomNav />
        <main className="app-main">
          <Routes>
            <Route path="/home" element={<HomeScreen />} />
            <Route path="/ask" element={<AskScreen />} />
            <Route path="/stories" element={<BoardScreen />} />
            <Route path="/board" element={<Navigate replace to="/stories" />} />
            <Route path="/questions/:questionId" element={<QuestionDetailScreen />} />
            <Route path="/doctors/:doctorId" element={<DoctorProfileScreen />} />
            <Route path="/booking/:doctorId" element={<BookingScreen />} />
            <Route path="/me" element={<MyPageScreen />} />
            <Route path="/doctor/inbox" element={<DoctorInboxScreen />} />
            <Route path="/doctor/questions/:questionId" element={<DoctorAnswerScreen />} />
            <Route path="*" element={<Navigate replace to="/home" />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export function App() {
  return (
    <HashRouter>
      <CommunityProvider>
        <AppRoutes />
      </CommunityProvider>
    </HashRouter>
  )
}
