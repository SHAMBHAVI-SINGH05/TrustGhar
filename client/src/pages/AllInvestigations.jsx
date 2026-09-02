import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, CheckCircle, Clock, XCircle, Activity } from 'lucide-react'
import api from '../api/axios'
import Sidebar from '../components/Sidebar'

const statusConfig = {
  complete: { label: 'Completed', icon: <CheckCircle className="w-3 h-3" />, cls: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/25' },
  pending: { label: 'Pending', icon: <Clock className="w-3 h-3" />, cls: 'text-stone-400 bg-white/5 border border-white/10' },
  running: { label: 'Running', icon: <Clock className="w-3 h-3" />, cls: 'text-amber-400 bg-amber-500/10 border border-amber-500/25' },
  failed: { label: 'Failed', icon: <XCircle className="w-3 h-3" />, cls: 'text-red-400 bg-red-500/10 border border-red-500/25' },
}

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

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

function AllInvestigations() {
  const navigate = useNavigate()
  const [investigations, setInvestigations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/investigations?limit=1000')
      .then((res) => setInvestigations(res.data))
      .catch((err) => console.error('Failed to load investigations:', err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #1c1008 0%, #2d1a06 40%, #1a120a 100%)' }}>

      <Sidebar active="Investigations" />

      <div className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-8 py-10">

          <div className="mb-6">
            <h1 className="text-white text-2xl font-extrabold tracking-tight">All Investigations</h1>
            <p className="text-stone-400 text-sm mt-1">Every property investigation you've run on TrustGhar</p>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-2 px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <Activity className="w-4 h-4 text-amber-400" />
              <h2 className="text-white font-bold text-sm">{investigations.length} Investigation{investigations.length !== 1 ? 's' : ''}</h2>
            </div>

            <div className="grid grid-cols-12 px-6 py-2.5" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="col-span-6 text-stone-500 text-xs font-semibold uppercase tracking-wider">Property</span>
              <span className="col-span-2 text-stone-500 text-xs font-semibold uppercase tracking-wider">Date</span>
              <span className="col-span-2 text-stone-500 text-xs font-semibold uppercase tracking-wider">Score</span>
              <span className="col-span-2 text-stone-500 text-xs font-semibold uppercase tracking-wider">Status</span>
            </div>

            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              {loading && (
                <p className="text-stone-400 text-sm px-6 py-6">Loading investigations...</p>
              )}
              {!loading && investigations.length === 0 && (
                <p className="text-stone-400 text-sm px-6 py-6">No investigations yet — start your first one.</p>
              )}
              {investigations.map((item) => (
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
        </div>
      </div>
    </div>
  )
}

export default AllInvestigations
