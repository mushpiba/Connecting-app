import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppHeader } from './components/AppHeader'
import { BottomNav } from './components/BottomNav'
import { AskScreen } from './features/patient/AskScreen'
import { BoardScreen } from './features/patient/BoardScreen'
import { DoctorProfileScreen } from './features/patient/DoctorProfileScreen'
import { HomeScreen } from './features/patient/HomeScreen'
import { MyPageScreen } from './features/patient/MyPageScreen'
import { QuestionDetailScreen } from './features/patient/QuestionDetailScreen'
import { DoctorAnswerScreen } from './features/doctor/DoctorAnswerScreen'
import { DoctorInboxScreen } from './features/doctor/DoctorInboxScreen'
import { CommunityProvider } from './state/CommunityContext'

export function App() {
  return (
    <HashRouter>
      <CommunityProvider>
        <div className="app-root">
          <AppHeader />
          <div className="app-body">
            <BottomNav />
            <main className="app-main">
              <Routes>
                <Route path="/home" element={<HomeScreen />} />
                <Route path="/ask" element={<AskScreen />} />
                <Route path="/board" element={<BoardScreen />} />
                <Route path="/questions/:questionId" element={<QuestionDetailScreen />} />
                <Route path="/doctors/:doctorId" element={<DoctorProfileScreen />} />
                <Route path="/me" element={<MyPageScreen />} />
                <Route path="/doctor/inbox" element={<DoctorInboxScreen />} />
                <Route path="/doctor/questions/:questionId" element={<DoctorAnswerScreen />} />
                <Route path="*" element={<Navigate replace to="/home" />} />
              </Routes>
            </main>
          </div>
        </div>
      </CommunityProvider>
    </HashRouter>
  )
}
