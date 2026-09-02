import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, Eye, AlertTriangle, FileText, ChevronRight, Plus, FolderSearch, Upload, Radio, MapPin, CheckCircle, Clock, XCircle, ArrowUpRight, Activity } from 'lucide-react'
import api from '../api/axios'
import useUnreadAlerts from '../hooks/useUnreadAlerts'
import Sidebar from '../components/Sidebar'

const severityStyle = {
  critical: 'bg-red-500/10 border-red-500/25 text-red-400',
  warning: 'bg-orange-500/10 border-orange-500/25 text-orange-400',
  info: 'bg-white/5 border-white/10 text-stone-400',
}

function timeAgo(dateStr) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const statusConfig = {
  complete: { label: 'Completed', icon: <CheckCircle className="w-3 h-3" />, cls: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/25' },
  pending: { label: 'Pending', icon: <Clock className="w-3 h-3" />, cls: 'text-stone-400 bg-white/5 border border-white/10' },
  running: { label: 'Running', icon: <Clock className="w-3 h-3" />, cls: 'text-amber-400 bg-amber-500/10 border border-amber-500/25' },
  failed: { label: 'Failed', icon: <XCircle className="w-3 h-3" />, cls: 'text-red-400 bg-red-500/10 border border-red-500/25' },
}

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

function getActivityData(investigations) {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    days.push(d)
  }
  return days.map((day) => {
    const next = new Date(day)
    next.setDate(next.getDate() + 1)
    const count = investigations.filter((inv) => {
      const created = new Date(inv.createdAt)
      return created >= day && created < next
    }).length
    return { label: day.toLocaleDateString('en-IN', { weekday: 'short' }), count }
  })
}

function ScoreBar({ score }) {
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs font-bold" style={{ color }}>{score}</span>
    </div>
  )
}

function Dashboard() {
  const navigate = useNavigate()
  const unreadAlerts = useUnreadAlerts()
  const [investigations, setInvestigations] = useState([])
  const [loadingInvestigations, setLoadingInvestigations] = useState(true)
  const [stats, setStats] = useState({ totalInvestigations: 0, monitoredCount: 0, unreadAlerts: 0, completedReports: 0 })
  const [liveAlerts, setLiveAlerts] = useState([])
  const [userName, setUserName] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/investigations')
      .then((res) => setInvestigations(res.data))
      .catch((err) => console.error('Failed to load investigations:', err))
      .finally(() => setLoadingInvestigations(false))

    api.get('/dashboard')
      .then((res) => setStats(res.data))
      .catch((err) => console.error('Failed to load dashboard stats:', err))

    api.get('/alerts')
      .then((res) => setLiveAlerts(res.data.slice(0, 4)))
      .catch((err) => console.error('Failed to load alerts:', err))

    api.get('/auth/me')
      .then((res) => setUserName(res.data.name))
      .catch((err) => console.error('Failed to load user:', err))
  }, [])

  const filteredInvestigations = investigations.filter((inv) =>
    (inv.propertyAddress || '').toLowerCase().includes(search.toLowerCase())
  )
  const activity = getActivityData(investigations)
  const maxActivity = Math.max(...activity.map((d) => d.count), 1)

  const statTiles = [
    { label: 'Investigations', value: stats.totalInvestigations, icon: <FolderSearch className="w-4 h-4 text-amber-400" /> },
    { label: 'Monitored', value: stats.monitoredCount, icon: <Eye className="w-4 h-4 text-amber-400" /> },
    { label: 'Unread Alerts', value: stats.unreadAlerts, icon: <AlertTriangle className="w-4 h-4 text-red-400" /> },
    { label: 'Reports', value: stats.completedReports, icon: <FileText className="w-4 h-4 text-amber-400" /> },
  ]

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #1c1008 0%, #2d1a06 40%, #1a120a 100%)' }}>

      <Sidebar active="Dashboard" />

      {/* Main content */}
      <div className="flex-1 min-w-0">

        {/* Top bar */}
        <div className="sticky top-0 z-40 px-8 py-4 flex items-center justify-between backdrop-blur-md" style={{ background: 'rgba(28,16,8,0.55)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h1 className="text-white text-lg font-bold tracking-tight">
              {stats.totalInvestigations === 0 ? 'Welcome' : 'Welcome back'}{userName ? `, ${userName}` : ''}
            </h1>
            <p className="text-stone-500 text-xs">Your property intelligence overview for today</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search investigations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-stone-500 outline-none focus:border-amber-500/50 transition-colors w-48"
              />
            </div>
            <button onClick={() => navigate('/alerts')} className="relative p-2 rounded-xl hover:bg-white/5 transition-colors">
              <Bell className="w-4 h-4 text-stone-400" />
              {unreadAlerts > 0 && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-400 rounded-full" />}
            </button>
            <button onClick={() => navigate('/investigate/new')} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-amber-500/20">
              <Plus className="w-4 h-4" />
              New Investigation
            </button>
          </div>
        </div>

        <div className="px-8 py-6">

          {/* Activity chart + stat tiles */}
          <div className="grid grid-cols-3 gap-5 mb-5">
            <div className="col-span-2 rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-white font-bold text-sm">Investigation Activity</h2>
                <Activity className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-stone-500 text-xs mb-6">Investigations started, last 7 days</p>
              <div className="flex items-end gap-3 h-28">
                {activity.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-stone-400 text-[11px] font-semibold">{d.count > 0 ? d.count : ''}</span>
                    <div
                      className="w-full rounded-t-md bg-amber-500/70"
                      style={{ height: `${Math.max((d.count / maxActivity) * 100, 3)}%` }}
                    />
                    <span className="text-stone-500 text-[10px] uppercase tracking-wide">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {statTiles.map((s, i) => (
                <div key={i} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="bg-white/5 p-1.5 rounded-lg w-fit mb-3">{s.icon}</div>
                  <p className="text-white text-2xl font-extrabold tracking-tight">{s.value}</p>
                  <p className="text-stone-500 text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-3 gap-5">

            {/* Investigations table */}
            <div className="col-span-2 rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <h2 className="text-white font-bold text-sm">Recent Investigations</h2>
                </div>
                <button onClick={() => navigate('/investigations')} className="flex items-center gap-1 text-amber-400 hover:text-amber-300 text-xs font-semibold">
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-12 px-6 py-2.5" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="col-span-6 text-stone-500 text-xs font-semibold uppercase tracking-wider">Property</span>
                <span className="col-span-2 text-stone-500 text-xs font-semibold uppercase tracking-wider">Date</span>
                <span className="col-span-2 text-stone-500 text-xs font-semibold uppercase tracking-wider">Score</span>
                <span className="col-span-2 text-stone-500 text-xs font-semibold uppercase tracking-wider">Status</span>
              </div>

              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {loadingInvestigations && (
                  <p className="text-stone-400 text-sm px-6 py-6">Loading investigations...</p>
                )}
                {!loadingInvestigations && filteredInvestigations.length === 0 && (
                  <p className="text-stone-400 text-sm px-6 py-6">
                    {search ? 'No investigations match your search.' : 'No investigations yet — start your first one.'}
                  </p>
                )}
                {filteredInvestigations.map((item) => (
                  <div key={item._id} onClick={() => navigate(`/report/${item._id}`)} className="grid grid-cols-12 items-center px-6 py-3.5 hover:bg-amber-500/5 transition-colors cursor-pointer group">
                    <div className="col-span-6 flex items-center gap-3">
                      <div className="bg-white/5 group-hover:bg-amber-500/15 transition-colors p-2 rounded-lg">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-400 transition-colors" />
                      </div>
                      <div>
                        <p className="text-stone-200 text-sm font-semibold leading-tight">{item.propertyAddress}</p>
                      </div>
                    </div>
                    <span className="col-span-2 text-stone-500 text-xs">{formatDate(item.createdAt)}</span>
                    <div className="col-span-2">
                      {item.status === 'complete' ? <ScoreBar score={item.trustScore} /> : <span className="text-stone-600 text-xs">—</span>}
                    </div>
                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${statusConfig[item.status].cls}`}>
                        {statusConfig[item.status].icon}
                        {statusConfig[item.status].label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Alerts */}
            <div className="rounded-2xl p-5 flex flex-col" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-sm">Live Alerts</h2>
                {stats.unreadAlerts > 0 && (
                  <span className="bg-red-500/10 text-red-400 text-xs font-bold px-2 py-0.5 rounded-md border border-red-500/25">{stats.unreadAlerts} new</span>
                )}
              </div>
              <div className="flex flex-col gap-2.5 flex-1 justify-between">
                {liveAlerts.length === 0 && (
                  <p className="text-stone-400 text-sm py-6 text-center">No alerts yet.</p>
                )}
                {liveAlerts.map((a) => (
                  <div key={a._id} className={`p-3 rounded-xl border text-xs ${severityStyle[a.severity] || severityStyle.info}`}>
                    <p className="font-medium leading-snug mb-1">{a.message}</p>
                    <p className="opacity-60">{timeAgo(a.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl p-5 mt-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 className="text-white font-bold text-sm mb-4">Quick Actions</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: <Search className="w-5 h-5 text-amber-400" />, label: 'Start Investigation', sub: 'Analyze a new property with AI agents', path: '/investigate/new' },
                { icon: <Upload className="w-5 h-5 text-amber-400" />, label: 'Upload Document', sub: 'PDF analysis — sale deed, RERA certificate', path: '/documents' },
                { icon: <Radio className="w-5 h-5 text-amber-400" />, label: 'Monitor Property', sub: 'Get alerted on changes & new complaints', path: '/monitor' },
              ].map((a, i) => (
                <button key={i} onClick={() => navigate(a.path)} className="flex items-center gap-4 p-4 rounded-xl transition-all text-left group w-full" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors p-3 rounded-xl shrink-0">
                    {a.icon}
                  </div>
                  <div>
                    <p className="text-stone-200 text-sm font-bold">{a.label}</p>
                    <p className="text-stone-500 text-xs mt-0.5">{a.sub}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-stone-500 group-hover:text-amber-400 transition-colors ml-auto shrink-0" />
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Dashboard
