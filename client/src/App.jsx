import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NewInvestigation from './pages/NewInvestigation'
import LiveInvestigation from './pages/LiveInvestigation'
import Report from './pages/Report'
import Alerts from './pages/Alerts'
import Monitor from './pages/Monitor'
import Documents from './pages/Documents'
import ProtectedRoute from './components/ProtectedRoute'
import PageTransition from './components/PageTransition'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/dashboard" element={<ProtectedRoute><PageTransition><Dashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/investigate/new" element={<ProtectedRoute><PageTransition><NewInvestigation /></PageTransition></ProtectedRoute>} />
        <Route path="/investigate/live/:id" element={<ProtectedRoute><PageTransition><LiveInvestigation /></PageTransition></ProtectedRoute>} />
        <Route path="/report/:id" element={<ProtectedRoute><PageTransition><Report /></PageTransition></ProtectedRoute>} />
        <Route path="/alerts" element={<ProtectedRoute><PageTransition><Alerts /></PageTransition></ProtectedRoute>} />
        <Route path="/monitor" element={<ProtectedRoute><PageTransition><Monitor /></PageTransition></ProtectedRoute>} />
        <Route path="/documents" element={<ProtectedRoute><PageTransition><Documents /></PageTransition></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
