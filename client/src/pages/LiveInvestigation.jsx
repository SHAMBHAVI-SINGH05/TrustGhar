import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import { Search, Brain, FileSearch, BarChart3, CheckCircle, Loader2, Clock, ArrowRight } from 'lucide-react'
import api from '../api/axios'
import Sidebar from '../components/Sidebar'

const agentDefsByNode = {
  rera_check: { icon: Search, name: 'RERA Scraper Agent' },
  fraud_check: { icon: Brain, name: 'Fraud Detector Agent' },
  document_check: { icon: FileSearch, name: 'Document Analyzer Agent' },
  generate_report: { icon: BarChart3, name: 'Report Generator Agent' },
}

const stepsByType = {
  full: ['rera_check', 'fraud_check', 'document_check', 'generate_report'],
  quick: ['rera_check', 'generate_report'],
  document: ['document_check', 'generate_report'],
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
  const [steps, setSteps] = useState(stepsByType.full)
  const [statuses, setStatuses] = useState(['pending', 'pending', 'pending', 'pending'])
  const [logs, setLogs] = useState([])
  const logEndRef = useRef(null)
  const socketRef = useRef(null)
  const stepsRef = useRef(steps)

  useEffect(() => {
    stepsRef.current = steps
  }, [steps])

  const showCompleteState = (inv) => {
    setStatuses(stepsRef.current.map(() => 'done'))
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
    const socket = io(import.meta.env.VITE_API_URL)
    socketRef.current = socket

    socket.emit('join-investigation', id)

    socket.on('agent-update', ({ node, output }) => {
      const index = stepsRef.current.indexOf(node)
      if (index === -1) return
      const text = extractText(node, output)
      setStatuses(prev => prev.map((s, i) => {
        if (i <= index) return 'done'
        if (i === index + 1) return 'running'
        return s
      }))
      setLogs(prev => [...prev, `${agentDefsByNode[node].name}: ${(text || '').substring(0, 160)}`])
    })

    socket.on('investigation-complete', (inv) => {
      showCompleteState(inv)
    })

    socket.on('investigation-failed', () => {
      setStatuses(stepsRef.current.map(() => 'pending'))
      setLogs(['Investigation failed. Please try again from the dashboard.'])
    })

    return () => socket.disconnect()
  }, [id])

  // Fallback safety net: poll in case the socket connection missed anything.
  useEffect(() => {
    let pollInterval = null
    let typeKnown = false

    const checkStatus = async () => {
      try {
        const { data } = await api.get(`/investigations/${id}`)

        if (!typeKnown) {
          typeKnown = true
          const activeSteps = stepsByType[data.type] || stepsByType.full
          setSteps(activeSteps)
          setStatuses(activeSteps.map(() => 'pending'))
        }

        if (data.status === 'running') {
          setStatuses(prev => (prev[0] === 'pending' ? ['running', ...prev.slice(1)] : prev))
        }

        if (data.status === 'complete') {
          clearInterval(pollInterval)
          showCompleteState(data)
        }

        if (data.status === 'failed') {
          clearInterval(pollInterval)
          setStatuses(stepsRef.current.map(() => 'pending'))
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
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #1c1008 0%, #2d1a06 40%, #1a120a 100%)' }}>

      <Sidebar active="Investigations" />

      <div className="flex-1 min-w-0">
        <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-white text-2xl font-extrabold tracking-tight">Investigation in Progress</h1>
          <p className="text-stone-400 text-sm mt-1">
            {investigation?.propertyAddress || 'Starting investigation...'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 items-stretch">

          {/* Agent timeline */}
          <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 className="text-white font-bold text-sm mb-5">Agent Pipeline</h2>
            <div className="flex flex-col gap-4">
              {steps.map((node, i) => {
                const agent = agentDefsByNode[node]
                const Icon = agent.icon
                const status = statuses[i]
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`p-2 rounded-lg
                        ${status === 'done' ? 'bg-emerald-500/15' : status === 'running' ? 'bg-amber-500/15' : 'bg-white/5'}`}>
                        <Icon className={`w-4 h-4
                          ${status === 'done' ? 'text-emerald-400' : status === 'running' ? 'text-amber-400' : 'text-stone-600'}`} />
                      </div>
                      {i < steps.length - 1 && <div className="w-px h-8 mt-1" style={{ background: 'rgba(255,255,255,0.1)' }} />}
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-semibold ${status === 'pending' ? 'text-stone-500' : 'text-stone-200'}`}>
                          {agent.name}
                        </p>
                        {status === 'done' && (
                          <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                            <CheckCircle className="w-3.5 h-3.5" /> Done
                          </span>
                        )}
                        {status === 'running' && (
                          <span className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Running
                          </span>
                        )}
                        {status === 'pending' && (
                          <span className="flex items-center gap-1 text-stone-600 text-xs font-semibold">
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
          <div className="rounded-2xl p-6 shadow-sm flex flex-col" style={{ background: '#100a05', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 className="text-white font-bold text-sm mb-4">Live Log</h2>
            <div className="flex flex-col gap-2 flex-1 overflow-y-auto font-mono">
              {logs.length === 0 && (
                <p className="text-stone-500 text-xs">Waiting for agents to start...</p>
              )}
              {logs.map((line, i) => (
                <p key={i} className="text-emerald-400 text-xs leading-relaxed">
                  <span className="text-stone-600">[{i + 1}]</span> {line}
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
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20'
              : 'bg-white/5 text-stone-600 cursor-not-allowed'}`}>
          View Report
          <ArrowRight className="w-5 h-5" />
        </button>
        </div>
      </div>
    </div>
  )
}

export default LiveInvestigation
