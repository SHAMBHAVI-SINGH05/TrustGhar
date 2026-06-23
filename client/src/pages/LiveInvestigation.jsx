import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Bell, LogOut, Search, Brain, FileSearch, BarChart3, CheckCircle, Loader2, Clock, ArrowRight } from 'lucide-react'

const agents = [
  { icon: Search, name: 'RERA Scraper Agent', log: 'RERA data fetched — registration verified for Whitefield, Bangalore' },
  { icon: Brain, name: 'Fraud Detector Agent', log: 'Knowledge graph built — 2 builder connections flagged for review' },
  { icon: FileSearch, name: 'Document Analyzer Agent', log: 'Sale deed scanned — no red flag clauses detected' },
  { icon: BarChart3, name: 'Report Generator Agent', log: 'Trust score computed — final report ready' },
]

function LiveInvestigation() {
  const navigate = useNavigate()
  const [statuses, setStatuses] = useState(agents.map(() => 'pending'))
  const [logs, setLogs] = useState([])
  const logEndRef = useRef(null)

  useEffect(() => {
    agents.forEach((agent, i) => {
      setTimeout(() => {
        setStatuses(prev => prev.map((s, idx) => (idx === i ? 'running' : s)))
      }, i * 2500)

      setTimeout(() => {
        setStatuses(prev => prev.map((s, idx) => (idx === i ? 'done' : s)))
        setLogs(prev => [...prev, agent.log])
      }, i * 2500 + 2000)
    })
  }, [])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const allDone = statuses.every(s => s === 'done')

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
          <button className="text-stone-400 hover:text-red-500 transition-colors p-1"><LogOut className="w-4 h-4" /></button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-stone-900 text-2xl font-extrabold tracking-tight">Investigation in Progress</h1>
          <p className="text-stone-400 text-sm mt-1">Prestige Towers, Whitefield, Bangalore</p>
        </div>

        <div className="grid grid-cols-2 gap-6 items-start">

          {/* Agent timeline */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
            <h2 className="text-stone-900 font-bold text-sm mb-5">Agent Pipeline</h2>
            <div className="flex flex-col gap-4">
              {agents.map((agent, i) => {
                const Icon = agent.icon
                const status = statuses[i]
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`p-2 rounded-lg
                        ${status === 'done' ? 'bg-emerald-50' : status === 'running' ? 'bg-indigo-50' : 'bg-stone-50'}`}>
                        <Icon className={`w-4 h-4
                          ${status === 'done' ? 'text-emerald-500' : status === 'running' ? 'text-indigo-500' : 'text-stone-300'}`} />
                      </div>
                      {i < agents.length - 1 && <div className="w-px h-8 bg-stone-200 mt-1" />}
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-semibold ${status === 'pending' ? 'text-stone-400' : 'text-stone-800'}`}>
                          {agent.name}
                        </p>
                        {status === 'done' && (
                          <span className="flex items-center gap-1 text-emerald-500 text-xs font-semibold">
                            <CheckCircle className="w-3.5 h-3.5" /> Done
                          </span>
                        )}
                        {status === 'running' && (
                          <span className="flex items-center gap-1 text-indigo-500 text-xs font-semibold">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Running
                          </span>
                        )}
                        {status === 'pending' && (
                          <span className="flex items-center gap-1 text-stone-300 text-xs font-semibold">
                            <Clock className="w-3.5 h-3.5" /> Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Live console log */}
          <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#1c1c24' }}>
            <h2 className="text-white font-bold text-sm mb-4">Live Log</h2>
            <div className="flex flex-col gap-2 h-64 overflow-y-auto font-mono">
              {logs.length === 0 && (
                <p className="text-stone-500 text-xs">Waiting for first agent to start...</p>
              )}
              {logs.map((line, i) => (
                <p key={i} className="text-emerald-400 text-xs leading-relaxed">
                  <span className="text-stone-500">[{i + 1}]</span> {line}
                </p>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>

        <button
          disabled={!allDone}
          onClick={() => navigate('/report')}
          className={`w-full mt-6 py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-3
            ${allDone
              ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-200'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}>
          View Report
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

export default LiveInvestigation
