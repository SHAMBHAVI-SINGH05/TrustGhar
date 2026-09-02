import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, LayoutDashboard, FolderSearch, FileText, Link2, Bell, Radio, LogOut } from 'lucide-react'
import api from '../api/axios'
import useUnreadAlerts from '../hooks/useUnreadAlerts'

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Investigations', path: '/investigations', icon: FolderSearch },
  { label: 'Documents', path: '/documents', icon: FileText },
  { label: 'Listings', path: '/listings', icon: Link2 },
  { label: 'Alerts', path: '/alerts', icon: Bell },
  { label: 'Monitor', path: '/monitor', icon: Radio },
]

function Sidebar({ active }) {
  const navigate = useNavigate()
  const unreadAlerts = useUnreadAlerts()
  const [userName, setUserName] = useState('')

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => setUserName(res.data.name))
      .catch((err) => console.error('Failed to load user:', err))
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <aside className="w-60 shrink-0 flex flex-col px-4 py-6" style={{ background: 'rgba(28,16,8,0.6)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center gap-2.5 mb-7 px-1.5">
        <div className="bg-amber-500 p-1.5 rounded-lg shadow-md shadow-amber-500/30">
          <ShieldCheck className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-extrabold text-base tracking-tight">TrustGhar</span>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.label === active
          return (
            <button key={item.label} onClick={() => navigate(item.path)}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
              ${isActive ? 'bg-amber-500 text-white shadow-sm' : 'text-stone-400 hover:text-white hover:bg-white/5'}`}>
              <Icon className="w-4 h-4" />
              {item.label}
              {item.label === 'Alerts' && unreadAlerts > 0 && !isActive && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-red-400 rounded-full" />
              )}
            </button>
          )
        })}
      </nav>

      <div className="pt-4 mt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2.5 px-1.5 mb-3">
          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {userName ? userName[0].toUpperCase() : ''}
          </div>
          <p className="text-stone-200 text-sm font-medium truncate">{userName}</p>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-stone-400 hover:text-red-400 hover:bg-white/5 text-sm font-medium transition-colors">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
