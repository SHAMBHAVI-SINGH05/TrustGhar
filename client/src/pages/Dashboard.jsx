import { ShieldCheck, Search, Bell, LogOut, TrendingUp, Eye, AlertTriangle, FileText, ChevronRight, Plus } from 'lucide-react'

const recentInvestigations = [
  { id: 1, address: 'Prestige Towers, Whitefield, Bangalore', status: 'Completed', score: 87, date: '15 Jun 2026' },
  { id: 2, address: 'DLF Phase 3, Gurugram, Haryana', status: 'Processing', score: null, date: '14 Jun 2026' },
  { id: 3, address: 'Lodha Palava, Dombivli, Mumbai', status: 'Completed', score: 61, date: '13 Jun 2026' },
  { id: 4, address: 'Sobha City, Sector 108, Gurugram', status: 'Failed', score: null, date: '12 Jun 2026' },
]

const stats = [
  { label: 'Total Investigations', value: '12', icon: <Search className="w-5 h-5" />, color: 'text-amber-500', bg: 'bg-amber-50' },
  { label: 'Monitored Properties', value: '4', icon: <Eye className="w-5 h-5" />, color: 'text-orange-500', bg: 'bg-orange-50' },
  { label: 'Unread Alerts', value: '3', icon: <AlertTriangle className="w-5 h-5" />, color: 'text-red-400', bg: 'bg-red-50' },
  { label: 'Reports Generated', value: '9', icon: <FileText className="w-5 h-5" />, color: 'text-stone-500', bg: 'bg-stone-100' },
]

function getScoreBadge(score) {
  if (score === null) return null
  const color = score >= 75 ? 'text-green-600 bg-green-50' : score >= 50 ? 'text-amber-600 bg-amber-50' : 'text-red-500 bg-red-50'
  return <span className={`text-xs font-bold px-2 py-1 rounded-lg ${color}`}>{score}/100</span>
}

function getStatusBadge(status) {
  const styles = {
    Completed: 'bg-green-50 text-green-600',
    Processing: 'bg-amber-50 text-amber-600',
    Failed: 'bg-red-50 text-red-500',
  }
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${styles[status]}`}>{status}</span>
}

function Dashboard() {
  return (
    <div className="min-h-screen bg-stone-100">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-stone-200 px-8 py-4 flex items-center justify-between"
        style={{ background: '#fdf8f2' }}>
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 p-2 rounded-xl shadow-sm shadow-amber-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-stone-900 text-lg font-extrabold tracking-tight">TrustGhar</span>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-xl hover:bg-stone-100 transition-colors">
            <Bell className="w-5 h-5 text-stone-500" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full" />
          </button>
          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-sm font-bold">
            S
          </div>
          <button className="flex items-center gap-1.5 text-stone-500 hover:text-red-500 transition-colors text-sm">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-stone-900 text-2xl font-extrabold tracking-tight">Good morning, Shambhavi 👋</h1>
            <p className="text-stone-400 text-sm mt-1">Here's your property intelligence overview</p>
          </div>
          <button className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm shadow-amber-500/30">
            <Plus className="w-4 h-4" />
            New Investigation
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
              <div className={`${stat.bg} ${stat.color} w-10 h-10 rounded-xl flex items-center justify-center mb-4`}>
                {stat.icon}
              </div>
              <p className="text-stone-900 text-2xl font-extrabold">{stat.value}</p>
              <p className="text-stone-400 text-sm mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Recent Investigations */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
            <h2 className="text-stone-900 font-bold text-base">Recent Investigations</h2>
            <button className="flex items-center gap-1 text-amber-500 hover:text-amber-600 text-sm font-semibold transition-colors">
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-stone-50">
            {recentInvestigations.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-6 py-4 hover:bg-stone-50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="bg-stone-100 p-2.5 rounded-xl">
                    <TrendingUp className="w-4 h-4 text-stone-400" />
                  </div>
                  <div>
                    <p className="text-stone-800 text-sm font-semibold">{item.address}</p>
                    <p className="text-stone-400 text-xs mt-0.5">{item.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getScoreBadge(item.score)}
                  {getStatusBadge(item.status)}
                  <ChevronRight className="w-4 h-4 text-stone-300" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default Dashboard
