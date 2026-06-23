import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Search, Bell, LogOut, Eye, AlertTriangle, FileText, ChevronRight, Plus, FolderSearch, Upload, Radio, MapPin, CheckCircle, Clock, XCircle, ArrowUpRight, Activity } from 'lucide-react'

const recentInvestigations = [
  { id: 1, address: 'Prestige Towers, Whitefield', city: 'Bangalore', status: 'Completed', score: 87, date: '15 Jun' },
  { id: 2, address: 'DLF Phase 3, Sector 24', city: 'Gurugram', status: 'Processing', score: null, date: '14 Jun' },
  { id: 3, address: 'Lodha Palava City', city: 'Mumbai', status: 'Completed', score: 61, date: '13 Jun' },
  { id: 4, address: 'Sobha City, Sector 108', city: 'Gurugram', status: 'Failed', score: null, date: '12 Jun' },
  { id: 5, address: 'Brigade Horizon, KR Puram', city: 'Bangalore', status: 'Completed', score: 92, date: '11 Jun' },
]

const alerts = [
  { text: 'New complaint filed against Lodha builders', time: '2h ago', type: 'warning' },
  { text: 'RERA registration expired for Prestige Towers', time: '5h ago', type: 'error' },
  { text: 'Trust score updated: DLF Phase 3', time: '1d ago', type: 'info' },
  { text: 'Builder CIN mismatch detected', time: '2d ago', type: 'warning' },
]

const statusConfig = {
  Completed: { icon: <CheckCircle className="w-3 h-3" />, cls: 'text-emerald-600 bg-emerald-50 border border-emerald-200' },
  Processing: { icon: <Clock className="w-3 h-3" />, cls: 'text-indigo-600 bg-indigo-50 border border-indigo-200' },
  Failed: { icon: <XCircle className="w-3 h-3" />, cls: 'text-red-500 bg-red-50 border border-red-200' },
}

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
            {['Dashboard', 'Investigations', 'Documents', 'Alerts', 'Monitor'].map((item, i) => (
              <button key={i} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all
                ${i === 0 ? 'bg-indigo-500 text-white shadow-sm' : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'}`}>
                {item}
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
          <button className="text-stone-400 hover:text-red-500 transition-colors p-1"><LogOut className="w-4 h-4" /></button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 py-8">

        {/* Welcome row */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-stone-900 text-3xl font-extrabold tracking-tight mb-1">Welcome back, Shambhavi</h1>
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
            { label: 'Investigations', value: '12', sub: '+2 this month', icon: <FolderSearch className="w-5 h-5 text-indigo-500" />, up: true },
            { label: 'Monitored', value: '4', sub: 'Active watch', icon: <Eye className="w-5 h-5 text-indigo-500" />, up: true },
            { label: 'Unread Alerts', value: '3', sub: 'Needs attention', icon: <AlertTriangle className="w-5 h-5 text-red-400" />, up: false },
            { label: 'Reports', value: '9', sub: 'Last 30 days', icon: <FileText className="w-5 h-5 text-indigo-500" />, up: true },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-indigo-50 p-2 rounded-xl">
                  {s.icon}
                </div>
                <span className={`flex items-center gap-1 text-xs font-semibold ${s.up ? 'text-emerald-500' : 'text-red-400'}`}>
                  <ArrowUpRight className={`w-3 h-3 ${!s.up ? 'rotate-90' : ''}`} />
                  {s.sub}
                </span>
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
              {recentInvestigations.map((item) => (
                <div key={item.id} className="grid grid-cols-12 items-center px-6 py-3.5 hover:bg-indigo-50/30 transition-colors cursor-pointer group">
                  <div className="col-span-6 flex items-center gap-3">
                    <div className="bg-stone-100 group-hover:bg-indigo-100 transition-colors p-2 rounded-lg">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 group-hover:text-indigo-500 transition-colors" />
                    </div>
                    <div>
                      <p className="text-stone-800 text-sm font-semibold leading-tight">{item.address}</p>
                      <p className="text-stone-400 text-xs">{item.city}</p>
                    </div>
                  </div>
                  <span className="col-span-2 text-stone-400 text-xs">{item.date}</span>
                  <div className="col-span-2">
                    {item.score ? <ScoreBar score={item.score} /> : <span className="text-stone-300 text-xs">—</span>}
                  </div>
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${statusConfig[item.status].cls}`}>
                      {statusConfig[item.status].icon}
                      {item.status}
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
              <span className="bg-red-50 text-red-500 text-xs font-bold px-2 py-0.5 rounded-md border border-red-100">3 new</span>
            </div>
            <div className="flex flex-col gap-2.5 flex-1 justify-between">
              {alerts.map((a, i) => (
                <div key={i} className={`p-3 rounded-xl border text-xs
                  ${a.type === 'warning' ? 'bg-orange-50 border-orange-200 text-orange-700'
                    : a.type === 'error' ? 'bg-red-50 border-red-200 text-red-600'
                    : 'bg-stone-50 border-stone-200 text-stone-500'}`}>
                  <p className="font-medium leading-snug mb-1">{a.text}</p>
                  <p className="opacity-60">{a.time}</p>
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
