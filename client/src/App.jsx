import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NewInvestigation from './pages/NewInvestigation'
import LiveInvestigation from './pages/LiveInvestigation'
import Report from './pages/Report'
import Alerts from './pages/Alerts'
import Monitor from './pages/Monitor'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/investigate/new" element={<ProtectedRoute><NewInvestigation /></ProtectedRoute>} />
        <Route path="/investigate/live/:id" element={<ProtectedRoute><LiveInvestigation /></ProtectedRoute>} />
        <Route path="/report/:id" element={<ProtectedRoute><Report /></ProtectedRoute>} />
        <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
        <Route path="/monitor" element={<ProtectedRoute><Monitor /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
