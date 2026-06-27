import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ShieldCheck, Bell, LogOut, Download, Radio, ArrowLeft, CheckCircle, AlertTriangle, XCircle, GitBranch, Lock, Hourglass } from 'lucide-react'
import api from '../api/axios'

const subScores = [
  { label: 'RERA Compliance', value: 94 },
  { label: 'Document Health', value: 88 },
  { label: 'Builder Reputation', value: 82 },
  { label: 'Fraud Risk (inverse)', value: 84 },
]

const findings = [
  { type: 'good', text: 'RERA registration is active and matches listed builder' },
  { type: 'good', text: 'Sale deed clauses reviewed — no predatory terms found' },
  { type: 'warning', text: '2 minor complaints filed against this builder in the last year' },
  { type: 'warning', text: 'Possession date in documents is 3 months later than listing claims' },
]

const circumference = 2 * Math.PI * 54

function Report() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [investigation, setInvestigation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [monitoring, setMonitoring] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  useEffect(() => {
    api.get(`/investigations/${id}`)
      .then((res) => {
        setInvestigation(res.data)
        setMonitoring(res.data.isMonitored)
      })
      .catch((err) => console.error('Failed to load investigation:', err))
      .finally(() => setLoading(false))
  }, [id])

  const handleMonitor = async () => {
    try {
      await api.post('/monitor', { investigationId: id })
      setMonitoring(true)
    } catch (err) {
      console.error('Failed to start monitoring:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5ede0' }}>
        <p className="text-stone-400 text-sm">Loading report...</p>
      </div>
    )
  }

  const isComplete = investigation?.status === 'complete'
  const score = investigation?.trustScore || 0
  const scoreColor = score >= 75 ? '#10b981' : score >= 50 ? '#6366f1' : '#ef4444'

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
                ${i === 1 ? 'bg-indigo-500 text-white shadow-sm' : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'}`}>
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
          <button onClick={handleLogout} className="text-stone-400 hover:text-red-500 transition-colors p-1"><LogOut className="w-4 h-4" /></button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-10">

        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-stone-400 hover:text-stone-700 text-sm font-medium mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-stone-900 text-2xl font-extrabold tracking-tight">Trust Report</h1>
            <p className="text-stone-400 text-sm mt-1">{investigation?.propertyAddress}</p>
          </div>
          {isComplete && (
            <button className="flex items-center gap-2 bg-white border border-stone-200 hover:border-indigo-300 text-stone-700 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm">
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          )}
        </div>

        {!isComplete && (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-stone-100 mb-6">
            <Hourglass className="w-8 h-8 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-700 text-sm font-semibold mb-1">Still processing</p>
            <p className="text-stone-400 text-sm">
              The AI agents haven't finished analyzing this property yet. Once the AI service is connected, your trust score and findings will appear here.
            </p>
          </div>
        )}

        {isComplete && (
          <div className="grid grid-cols-3 gap-6 mb-6">

            {/* Score gauge */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 flex flex-col items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 -rotate-90">
                  <circle cx="64" cy="64" r="54" fill="none" stroke="#f1efe9" strokeWidth="10" />
                  <circle
                    cx="64" cy="64" r="54" fill="none"
                    stroke={scoreColor} strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - score / 100)}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-stone-900">{score}</span>
                  <span className="text-stone-400 text-xs">/ 100</span>
                </div>
              </div>
              <p className="text-emerald-500 font-bold text-sm mt-4">Trustworthy</p>
              <p className="text-stone-400 text-xs text-center mt-1">Low risk — safe to proceed with standard due diligence</p>
            </div>

            {/* Sub-scores */}
            <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
              <h2 className="text-stone-900 font-bold text-sm mb-5">Score Breakdown</h2>
              <div className="flex flex-col gap-4">
                {subScores.map((s, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-stone-600 text-sm font-medium">{s.label}</span>
                      <span className="text-stone-800 text-sm font-bold">{s.value}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${s.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6 items-stretch">

          {/* Key findings */}
          <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
            <h2 className="text-stone-900 font-bold text-sm mb-5">Key Findings</h2>
            {isComplete ? (
              <div className="flex flex-col gap-3">
                {findings.map((f, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border
                    ${f.type === 'good' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                    {f.type === 'good'
                      ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      : <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                    <p className="text-stone-700 text-sm leading-relaxed">{f.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-stone-400 text-sm">Findings will appear here once the AI agents finish analyzing this property.</p>
            )}
          </div>

          {/* Fraud graph teaser + actions */}
          <div className="flex flex-col gap-5">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <GitBranch className="w-4 h-4 text-indigo-500" />
                <h3 className="text-stone-900 font-bold text-sm">Fraud Network Graph</h3>
              </div>
              <p className="text-stone-400 text-xs mb-4 leading-relaxed">
                Visualize builder connections and detect hidden ownership links.
              </p>
              <button disabled className="w-full flex items-center justify-center gap-2 bg-stone-100 text-stone-400 py-2.5 rounded-xl text-xs font-semibold cursor-not-allowed mt-auto">
                <Lock className="w-3.5 h-3.5" /> Coming Soon
              </button>
            </div>

            <button
              onClick={handleMonitor}
              disabled={monitoring}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all
                ${monitoring
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default'
                  : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-200'}`}>
              <Radio className="w-4 h-4" />
              {monitoring ? 'Monitoring Active' : 'Monitor This Property'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Report
