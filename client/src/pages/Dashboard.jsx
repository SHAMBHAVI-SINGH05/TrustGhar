import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Search, Bell, LogOut, Eye, AlertTriangle, FileText, ChevronRight, Plus, FolderSearch, Upload, Radio, MapPin, CheckCircle, Clock, XCircle, ArrowUpRight, Activity } from 'lucide-react'
import api from '../api/axios'

const severityStyle = {
  critical: 'bg-red-50 border-red-200 text-red-600',
  warning: 'bg-orange-50 border-orange-200 text-orange-700',
  info: 'bg-stone-50 border-stone-200 text-stone-500',
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
  complete: { label: 'Completed', icon: <CheckCircle className="w-3 h-3" />, cls: 'text-emerald-600 bg-emerald-50 border border-emerald-200' },
  pending: { label: 'Pending', icon: <Clock className="w-3 h-3" />, cls: 'text-stone-500 bg-stone-100 border border-stone-200' },
  running: { label: 'Running', icon: <Clock className="w-3 h-3" />, cls: 'text-indigo-600 bg-indigo-50 border border-indigo-200' },
  failed: { label: 'Failed', icon: <XCircle className="w-3 h-3" />, cls: 'text-red-500 bg-red-50 border border-red-200' },
}

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

function ScoreBar({ score }) {
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#6366f1' : '#ef4444'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-stone-200 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs font-bold" style={{ color }}>{score}</span>
    </div>
  )
}

function Dashboard() {
  const navigate = useNavigate()
  const [investigations, setInvestigations] = useState([])
  const [loadingInvestigations, setLoadingInvestigations] = useState(true)
  const [stats, setStats] = useState({ totalInvestigations: 0, monitoredCount: 0, unreadAlerts: 0, completedReports: 0 })
  const [liveAlerts, setLiveAlerts] = useState([])
  const [userName, setUserName] = useState('')

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

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
                ${item.label === 'Dashboard' ? 'bg-indigo-500 text-white shadow-sm' : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'}`}>
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
            <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">{userName ? userName[0].toUpperCase() : ''}</div>
            <span className="text-stone-700 text-sm font-medium">{userName}</span>
          </div>
          <button onClick={handleLogout} className="text-stone-400 hover:text-red-500 transition-colors p-1"><LogOut className="w-4 h-4" /></button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 py-8">

        {/* Welcome row */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-stone-900 text-3xl font-extrabold tracking-tight mb-1">Welcome back{userName ? `, ${userName}` : ''}</h1>
            <p className="text-stone-400 text-sm">Your property intelligence overview for today</p>
          </div>
          <button onClick={() => navigate('/investigate/new')} className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-200">
            <Plus className="w-4 h-4" />
            New Investigation
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Investigations', value: stats.totalInvestigations, sub: 'All time', icon: <FolderSearch className="w-5 h-5 text-indigo-500" /> },
            { label: 'Monitored', value: stats.monitoredCount, sub: 'Currently watched', icon: <Eye className="w-5 h-5 text-indigo-500" /> },
            { label: 'Unread Alerts', value: stats.unreadAlerts, sub: 'Needs attention', icon: <AlertTriangle className="w-5 h-5 text-red-400" /> },
            { label: 'Reports', value: stats.completedReports, sub: 'Completed', icon: <FileText className="w-5 h-5 text-indigo-500" /> },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-indigo-50 p-2 rounded-xl">
                  {s.icon}
                </div>
                <span className="text-stone-400 text-xs font-semibold">{s.sub}</span>
              </div>
              <p className="text-stone-900 text-4xl font-extrabold tracking-tight">{s.value}</p>
              <p className="text-stone-400 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-3 gap-5">

          {/* Investigations table */}
          <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-50">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-500" />
                <h2 className="text-stone-900 font-bold text-sm">Recent Investigations</h2>
              </div>
              <button className="flex items-center gap-1 text-indigo-500 hover:text-indigo-600 text-xs font-semibold">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-12 px-6 py-2.5 bg-stone-50 border-b border-stone-100">
              <span className="col-span-6 text-stone-400 text-xs font-semibold uppercase tracking-wider">Property</span>
              <span className="col-span-2 text-stone-400 text-xs font-semibold uppercase tracking-wider">Date</span>
              <span className="col-span-2 text-stone-400 text-xs font-semibold uppercase tracking-wider">Score</span>
              <span className="col-span-2 text-stone-400 text-xs font-semibold uppercase tracking-wider">Status</span>
            </div>

            <div className="divide-y divide-stone-50">
              {loadingInvestigations && (
                <p className="text-stone-400 text-sm px-6 py-6">Loading investigations...</p>
              )}
              {!loadingInvestigations && investigations.length === 0 && (
                <p className="text-stone-400 text-sm px-6 py-6">No investigations yet — start your first one.</p>
              )}
              {investigations.map((item) => (
                <div key={item._id} onClick={() => navigate(`/report/${item._id}`)} className="grid grid-cols-12 items-center px-6 py-3.5 hover:bg-indigo-50/30 transition-colors cursor-pointer group">
                  <div className="col-span-6 flex items-center gap-3">
                    <div className="bg-stone-100 group-hover:bg-indigo-100 transition-colors p-2 rounded-lg">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 group-hover:text-indigo-500 transition-colors" />
                    </div>
                    <div>
                      <p className="text-stone-800 text-sm font-semibold leading-tight">{item.propertyAddress}</p>
                    </div>
                  </div>
                  <span className="col-span-2 text-stone-400 text-xs">{formatDate(item.createdAt)}</span>
                  <div className="col-span-2">
                    {item.status === 'complete' ? <ScoreBar score={item.trustScore} /> : <span className="text-stone-300 text-xs">—</span>}
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
          <div className="bg-white rounded-2xl p-5 flex flex-col shadow-sm border border-stone-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-stone-900 font-bold text-sm">Live Alerts</h2>
              {stats.unreadAlerts > 0 && (
                <span className="bg-red-50 text-red-500 text-xs font-bold px-2 py-0.5 rounded-md border border-red-100">{stats.unreadAlerts} new</span>
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
        <div className="bg-white rounded-2xl p-5 mt-5 shadow-sm border border-stone-100">
          <h2 className="text-stone-900 font-bold text-sm mb-4">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: <Search className="w-5 h-5 text-indigo-500" />, label: 'Start Investigation', sub: 'Analyze a new property with AI agents' },
              { icon: <Upload className="w-5 h-5 text-indigo-500" />, label: 'Upload Document', sub: 'PDF analysis — sale deed, RERA certificate' },
              { icon: <Radio className="w-5 h-5 text-indigo-500" />, label: 'Monitor Property', sub: 'Get alerted on changes & new complaints' },
            ].map((a, i) => (
              <button key={i} className="flex items-center gap-4 p-4 rounded-xl border border-stone-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all text-left group w-full">
                <div className="bg-indigo-50 group-hover:bg-indigo-100 transition-colors p-3 rounded-xl shrink-0">
                  {a.icon}
                </div>
                <div>
                  <p className="text-stone-800 text-sm font-bold">{a.label}</p>
                  <p className="text-stone-400 text-xs mt-0.5">{a.sub}</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-stone-300 group-hover:text-indigo-500 transition-colors ml-auto shrink-0" />
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default Dashboard
