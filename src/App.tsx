import { useState } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppHeader } from './components/AppHeader'
import { BottomNav } from './components/BottomNav'
import { PreviewToolbar } from './components/PreviewToolbar'
import type { PreviewMode } from './components/PreviewToolbar'
import { AskScreen } from './features/patient/AskScreen'
import { BoardScreen } from './features/patient/BoardScreen'
import { BookingScreen } from './features/patient/BookingScreen'
import { DoctorProfileScreen } from './features/patient/DoctorProfileScreen'
import { HomeScreen } from './features/patient/HomeScreen'
import { ExpertGateScreen } from './features/patient/ExpertGateScreen'
import { MyPageScreen } from './features/patient/MyPageScreen'
import {
  AddressSettingsScreen,
  AppointmentsScreen,
  NotificationSettingsScreen,
  PaymentSettingsScreen,
  PrivacySettingsScreen,
} from './features/patient/MySettingsScreens'
import { NewsScreen } from './features/patient/NewsScreen'
import {
  ONBOARDING_COMPLETE_KEY,
  OnboardingScreen,
} from './features/patient/OnboardingScreen'
import { QuestionDetailScreen } from './features/patient/QuestionDetailScreen'
import { PrecheckScreen } from './features/patient/PrecheckScreen'
import { DoctorAnswerScreen } from './features/doctor/DoctorAnswerScreen'
import { DoctorInboxScreen } from './features/doctor/DoctorInboxScreen'
import { CommunityProvider } from './state/CommunityContext'
import { PatientSettingsProvider } from './state/PatientSettingsContext'

function AppRoutes() {
  const location = useLocation()
  const [onboardingComplete, setOnboardingComplete] = useState(
    () => localStorage.getItem(ONBOARDING_COMPLETE_KEY) === 'true',
  )
  const [previewMode, setPreviewMode] = useState<PreviewMode>('web')

  if (!onboardingComplete && location.pathname !== '/onboarding') {
    return (
      <Navigate
        replace
        to="/onboarding"
        state={{ returnTo: `${location.pathname}${location.search}` }}
      />
    )
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

  const focused =
    location.pathname === '/ask' ||
    location.pathname === '/expert' ||
    location.pathname.startsWith('/me/')

  return (
    <div className={`app-stage is-${previewMode}-preview`}>
      <PreviewToolbar mode={previewMode} onChange={setPreviewMode} />
      <div className="app-viewport" data-testid="app-viewport" data-preview-mode={previewMode}>
        <div className={`app-root ${focused ? 'is-focused' : ''}`}>
          {!focused && <AppHeader />}
          <div className="app-body">
            {!focused && <BottomNav />}
            <main className="app-main">
              <Routes>
            <Route path="/home" element={<HomeScreen />} />
            <Route path="/ask" element={<AskScreen />} />
            <Route path="/stories" element={<BoardScreen />} />
            <Route path="/board" element={<Navigate replace to="/stories" />} />
            <Route path="/news" element={<NewsScreen />} />
            <Route path="/expert" element={<ExpertGateScreen />} />
            <Route path="/questions/:questionId" element={<QuestionDetailScreen />} />
            <Route path="/doctors/:doctorId" element={<DoctorProfileScreen />} />
            <Route path="/booking/:doctorId" element={<BookingScreen />} />
            <Route path="/me" element={<MyPageScreen />} />
            <Route path="/me/precheck" element={<PrecheckScreen />} />
            <Route path="/me/address" element={<AddressSettingsScreen />} />
            <Route path="/me/payment" element={<PaymentSettingsScreen />} />
            <Route path="/me/notifications" element={<NotificationSettingsScreen />} />
            <Route path="/me/privacy" element={<PrivacySettingsScreen />} />
            <Route path="/me/appointments" element={<AppointmentsScreen />} />
            <Route path="/doctor/inbox" element={<DoctorInboxScreen />} />
            <Route path="/doctor/questions/:questionId" element={<DoctorAnswerScreen />} />
            <Route path="*" element={<Navigate replace to="/home" />} />
              </Routes>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}

export function App() {
  return (
    <HashRouter>
      <CommunityProvider>
        <PatientSettingsProvider>
          <AppRoutes />
        </PatientSettingsProvider>
      </CommunityProvider>
    </HashRouter>
  )
}
