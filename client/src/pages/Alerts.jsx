import { useState, useEffect } from 'react'
import { AlertTriangle, Gavel, Clock, TrendingDown, CheckCheck, Bell } from 'lucide-react'
import api from '../api/axios'
import Sidebar from '../components/Sidebar'

const typeConfig = {
  rera_complaint: { icon: AlertTriangle, label: 'RERA Complaint' },
  court_case: { icon: Gavel, label: 'Court Case' },
  possession_overdue: { icon: Clock, label: 'Possession Overdue' },
  score_change: { icon: TrendingDown, label: 'Score Change' },
}

const severityConfig = {
  critical: 'bg-red-500/10 border-red-500/25 text-red-400',
  warning: 'bg-amber-500/10 border-amber-500/25 text-amber-400',
  info: 'bg-white/5 border-white/10 text-stone-400',
}

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

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
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #1c1008 0%, #2d1a06 40%, #1a120a 100%)' }}>

      <Sidebar active="Alerts" />

      <div className="flex-1 min-w-0">
        <div className="max-w-4xl mx-auto px-8 py-10">

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-white text-2xl font-extrabold tracking-tight">Alerts</h1>
              <p className="text-stone-400 text-sm mt-1">
                {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="flex items-center gap-2 text-stone-200 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:bg-white/5" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
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
              <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Bell className="w-8 h-8 text-stone-600 mx-auto mb-3" />
                <p className="text-stone-400 text-sm">No alerts yet — they'll show up here once your monitored properties have updates.</p>
              </div>
            )}
            {alerts.map((alert) => {
              const TypeIcon = typeConfig[alert.type]?.icon || AlertTriangle
              return (
                <div key={alert._id} className={`flex items-start gap-3 p-4 rounded-2xl border ${severityConfig[alert.severity]} ${!alert.isRead ? '' : 'opacity-50'}`}>
                  <div className="p-2 rounded-lg bg-white/10 shrink-0">
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
    </div>
  )
}

export default Alerts
