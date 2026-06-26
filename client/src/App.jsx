import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NewInvestigation from './pages/NewInvestigation'
import LiveInvestigation from './pages/LiveInvestigation'
import Report from './pages/Report'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/investigate/new" element={<ProtectedRoute><NewInvestigation /></ProtectedRoute>} />
        <Route path="/investigate/live" element={<ProtectedRoute><LiveInvestigation /></ProtectedRoute>} />
        <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
