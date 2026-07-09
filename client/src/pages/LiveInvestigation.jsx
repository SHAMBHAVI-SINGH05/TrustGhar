import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import { ShieldCheck, Bell, LogOut, Search, Brain, FileSearch, BarChart3, CheckCircle, Loader2, Clock, ArrowRight } from 'lucide-react'
import api from '../api/axios'

const agentDefs = [
  { icon: Search, name: 'RERA Scraper Agent' },
  { icon: Brain, name: 'Fraud Detector Agent' },
  { icon: FileSearch, name: 'Document Analyzer Agent' },
  { icon: BarChart3, name: 'Report Generator Agent' },
]

const nodeToIndex = {
  rera_check: 0,
  fraud_check: 1,
  document_check: 2,
  generate_report: 3,
}

function extractText(node, output) {
  if (node === 'rera_check') return output.rera_status
  if (node === 'fraud_check') return output.fraud_status
  if (node === 'document_check') return output.document_status
  if (node === 'generate_report') return output.final_report
  return ''
}

function LiveInvestigation() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [investigation, setInvestigation] = useState(null)
  const [statuses, setStatuses] = useState(['pending', 'pending', 'pending', 'pending'])
  const [logs, setLogs] = useState([])
  const logEndRef = useRef(null)
  const socketRef = useRef(null)

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const showCompleteState = (inv) => {
    setStatuses(['done', 'done', 'done', 'done'])
    setInvestigation(inv)
    const realLogs = []
    if (inv.agentOutputs?.rera_status) realLogs.push(`RERA: ${inv.agentOutputs.rera_status.substring(0, 160)}`)
    if (inv.agentOutputs?.fraud_status) realLogs.push(`Fraud: ${inv.agentOutputs.fraud_status.substring(0, 160)}`)
    if (inv.agentOutputs?.document_status) realLogs.push(`Documents: ${inv.agentOutputs.document_status.substring(0, 160)}`)
    if (inv.report) realLogs.push(`Final verdict: ${inv.report.substring(0, 160)}`)
    setLogs(realLogs)
  }

  // Real-time updates: listen for each agent actually finishing.
  useEffect(() => {
    const socket = io('http://localhost:5000')
    socketRef.current = socket

    socket.emit('join-investigation', id)

    socket.on('agent-update', ({ node, output }) => {
      const index = nodeToIndex[node]
      if (index === undefined) return
      const text = extractText(node, output)
      setStatuses(prev => prev.map((s, i) => {
        if (i <= index) return 'done'
        if (i === index + 1) return 'running'
        return s
      }))
      setLogs(prev => [...prev, `${agentDefs[index].name}: ${(text || '').substring(0, 160)}`])
    })

    socket.on('investigation-complete', (inv) => {
      showCompleteState(inv)
    })

    socket.on('investigation-failed', () => {
      setStatuses(['pending', 'pending', 'pending', 'pending'])
      setLogs(['Investigation failed. Please try again from the dashboard.'])
    })

    return () => socket.disconnect()
  }, [id])

  // Fallback safety net: poll in case the socket connection missed anything.
  useEffect(() => {
    let pollInterval = null

    const checkStatus = async () => {
      try {
        const { data } = await api.get(`/investigations/${id}`)

        if (data.status === 'running') {
          setStatuses(prev => (prev[0] === 'pending' ? ['running', ...prev.slice(1)] : prev))
        }

        if (data.status === 'complete') {
          clearInterval(pollInterval)
          showCompleteState(data)
        }

        if (data.status === 'failed') {
          clearInterval(pollInterval)
          setStatuses(['pending', 'pending', 'pending', 'pending'])
          setLogs(['Investigation failed. Please try again from the dashboard.'])
        }
      } catch (err) {
        console.error('Poll error:', err)
      }
    }

    checkStatus()
    pollInterval = setInterval(checkStatus, 3000)

    return () => clearInterval(pollInterval)
  }, [id])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const allDone = statuses.every(s => s === 'done') && investigation?.status === 'complete'

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
          <button onClick={handleLogout} className="text-stone-400 hover:text-red-500 transition-colors p-1">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-stone-900 text-2xl font-extrabold tracking-tight">Investigation in Progress</h1>
          <p className="text-stone-400 text-sm mt-1">
            {investigation?.propertyAddress || 'Starting investigation...'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 items-stretch">

          {/* Agent timeline */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
            <h2 className="text-stone-900 font-bold text-sm mb-5">Agent Pipeline</h2>
            <div className="flex flex-col gap-4">
              {agentDefs.map((agent, i) => {
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
                      {i < agentDefs.length - 1 && <div className="w-px h-8 bg-stone-200 mt-1" />}
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
          <div className="rounded-2xl p-6 shadow-sm flex flex-col" style={{ background: '#1c1c24' }}>
            <h2 className="text-white font-bold text-sm mb-4">Live Log</h2>
            <div className="flex flex-col gap-2 flex-1 overflow-y-auto font-mono">
              {logs.length === 0 && (
                <p className="text-stone-500 text-xs">Waiting for agents to start...</p>
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
          onClick={() => navigate(`/report/${id}`)}
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
