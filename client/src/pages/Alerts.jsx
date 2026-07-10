import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Bell, LogOut, AlertTriangle, Gavel, Clock, TrendingDown, CheckCheck } from 'lucide-react'
import api from '../api/axios'

const typeConfig = {
  rera_complaint: { icon: AlertTriangle, label: 'RERA Complaint' },
  court_case: { icon: Gavel, label: 'Court Case' },
  possession_overdue: { icon: Clock, label: 'Possession Overdue' },
  score_change: { icon: TrendingDown, label: 'Score Change' },
}

const severityConfig = {
  critical: 'bg-red-50 border-red-200 text-red-700',
  warning: 'bg-amber-50 border-amber-200 text-amber-700',
  info: 'bg-stone-50 border-stone-200 text-stone-600',
}

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

function Alerts() {
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  useEffect(() => {
  api.get('/alerts')
    .then((res) => setAlerts(res.data))
    .catch((err) => console.error('Failed to load alerts:', err))
    .finally(() => setLoading(false))
}, [])
 const markAsRead = async (id) => {
  try {
    await api.patch(`/alerts/${id}/read`)
    setAlerts((prev) => prev.map((a) => (a._id === id ? { ...a, isRead: true } : a)))
  } catch (err) {
    console.error('Failed to mark alert as read:', err)
  }
}

const markAllAsRead = async () => {
  try {
    await api.patch('/alerts/read-all')
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })))
  } catch (err) {
    console.error('Failed to mark all as read:', err)
  }
}

  const unreadCount = alerts.filter((a) => !a.isRead).length

  return (
    <div className="min-h-screen" style={{ background: '#f5ede0' }}>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-stone-200 px-8 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-500 p-1.5 rounded-lg shadow-md shadow-indigo-200">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-stone-900 font-extrabold text-base tracking-tight">TrustGhar</span>
          </div>
          <div className="flex items-center gap-1">
            {[
              { label: 'Dashboard', path: '/dashboard' },
              { label: 'Investigations', path: '/dashboard' },
              { label: 'Documents', path: '/documents' },
              { label: 'Listings', path: '/listings' },
              { label: 'Alerts', path: '/alerts' },
              { label: 'Monitor', path: '/monitor' },
            ].map((item, i) => (
              <button key={i} onClick={() => navigate(item.path)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all
                ${item.label === 'Alerts' ? 'bg-indigo-500 text-white shadow-sm' : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'}`}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-xl hover:bg-stone-100 transition-colors">
            <Bell className="w-4 h-4 text-stone-400" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-400 rounded-full" />
          </button>
          <div className="flex items-center gap-2 bg-stone-100 rounded-full px-3 py-1.5">
            <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">S</div>
            <span className="text-stone-700 text-sm font-medium">Shambhavi</span>
          </div>
          <button onClick={handleLogout} className="text-stone-400 hover:text-red-500 transition-colors p-1"><LogOut className="w-4 h-4" /></button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-stone-900 text-2xl font-extrabold tracking-tight">Alerts</h1>
            <p className="text-stone-400 text-sm mt-1">
              {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="flex items-center gap-2 bg-white border border-stone-200 hover:border-indigo-300 text-stone-700 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm">
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {loading && (
            <p className="text-stone-400 text-sm">Loading alerts...</p>
          )}
          {!loading && alerts.length === 0 && (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-stone-100">
              <Bell className="w-8 h-8 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-500 text-sm">No alerts yet — they'll show up here once your monitored properties have updates.</p>
            </div>
          )}
          {alerts.map((alert) => {
            const TypeIcon = typeConfig[alert.type]?.icon || AlertTriangle
            return (
              <div key={alert._id} className={`flex items-start gap-3 p-4 rounded-2xl border ${severityConfig[alert.severity]} ${!alert.isRead ? 'shadow-sm' : 'opacity-60'}`}>
                <div className="p-2 rounded-lg bg-white/60 shrink-0">
                  <TypeIcon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold uppercase tracking-wider opacity-70">
                      {typeConfig[alert.type]?.label || alert.type}
                    </p>
                    {!alert.isRead && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                  </div>
                  <p className="text-sm font-medium mt-1">{alert.message}</p>
                  <p className="text-xs opacity-60 mt-1">{formatDate(alert.createdAt)}</p>
                </div>
                {!alert.isRead && (
                  <button onClick={() => markAsRead(alert._id)} className="text-xs font-semibold underline opacity-70 hover:opacity-100 shrink-0">
                    Mark read
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Alerts
