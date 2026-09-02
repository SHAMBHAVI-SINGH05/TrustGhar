import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Download, Radio, ArrowLeft, CheckCircle, AlertTriangle, XCircle, GitBranch, Hourglass, MessageCircle, Send } from 'lucide-react'
import { jsPDF } from 'jspdf'
import api from '../api/axios'
import FraudGraph from '../components/FraudGraph'
import Sidebar from '../components/Sidebar'

const circumference = 2 * Math.PI * 54

function textToScore(text = '') {
  let s = 70
  const t = text.toLowerCase()
  if (t.includes('fraud') || t.includes('scam') || t.includes('fake')) s -= 20
  if (t.includes('complaint')) s -= 10
  if (t.includes('delay') || t.includes('overdue')) s -= 5
  if (t.includes('warning') || t.includes('red flag')) s -= 8
  if (t.includes('registered') || t.includes('compliant') || t.includes('verified')) s += 15
  if (t.includes('no complaint') || t.includes('clean') || t.includes('no red flag')) s += 10
  if (t.includes('low risk') || t.includes('safe') || t.includes('trusted')) s += 5
  return Math.max(10, Math.min(100, s))
}

function getSubScores(inv) {
  if (!inv?.agentOutputs) return []
  const { rera_status = '', fraud_status = '', document_status = '',
          rera_score, fraud_score, document_score } = inv.agentOutputs
  const type = inv.type || 'full'
  const reraRan = type === 'full' || type === 'quick'
  const fraudRan = type === 'full'
  const documentRan = type === 'full' || type === 'document'

  const scores = []
  if (reraRan) scores.push({ label: 'RERA Compliance', value: rera_score ?? textToScore(rera_status) })
  if (documentRan) scores.push({ label: 'Document Health', value: document_score ?? textToScore(document_status) })
  if (fraudRan) {
    scores.push({ label: 'Builder Reputation', value: fraud_score ?? textToScore(rera_status + ' ' + fraud_status) })
    scores.push({ label: 'Fraud Risk (inverse)', value: fraud_score ?? textToScore(fraud_status) })
  }
  return scores
}

function getFindings(inv) {
  if (!inv?.agentOutputs) return []
  const entries = [
    { text: inv.agentOutputs.rera_status },
    { text: inv.agentOutputs.fraud_status },
    { text: inv.agentOutputs.document_status },
  ]
  return entries.filter(e => e.text).map(e => {
    const t = e.text.toLowerCase()
    const type = (t.includes('fraud') || t.includes('scam') || t.includes('high risk') || t.includes('fake'))
      ? 'danger'
      : (t.includes('complaint') || t.includes('warning') || t.includes('delay') || t.includes('red flag') || t.includes('asymmetric') || t.includes('concern'))
      ? 'warning'
      : 'good'
    return { type, text: e.text.length > 240 ? e.text.substring(0, 240) + '...' : e.text }
  })
}

function getVerdict(score) {
  if (score >= 75) return { label: 'Trustworthy', desc: 'Low risk — safe to proceed with standard due diligence', color: 'text-emerald-400' }
  if (score >= 50) return { label: 'Moderate Risk', desc: 'Proceed with caution — verify key concerns before signing', color: 'text-amber-400' }
  return { label: 'High Risk', desc: 'Significant red flags detected — seek legal advice before proceeding', color: 'text-red-400' }
}

function Report() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [investigation, setInvestigation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [monitoring, setMonitoring] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)

  useEffect(() => {
    api.get(`/investigations/${id}`)
      .then((res) => {
        setInvestigation(res.data)
        setMonitoring(res.data.isMonitored)
        if (res.data.status === 'complete') {
          api.get(`/investigations/${id}/chat`)
            .then((chatRes) => setChatMessages(chatRes.data))
            .catch((err) => console.error('Failed to load chat history:', err))
        }
      })
      .catch((err) => console.error('Failed to load investigation:', err))
      .finally(() => setLoading(false))
  }, [id])

  const handleSendChat = async (e) => {
    e.preventDefault()
    const question = chatInput.trim()
    if (!question || chatSending) return

    setChatMessages((prev) => [...prev, { _id: `temp-${Date.now()}`, role: 'user', text: question }])
    setChatInput('')
    setChatSending(true)

    try {
      const res = await api.post(`/investigations/${id}/chat`, { question })
      setChatMessages((prev) => [...prev, res.data])
    } catch (err) {
      console.error('Failed to send chat message:', err)
      setChatMessages((prev) => [...prev, { _id: `temp-error-${Date.now()}`, role: 'assistant', text: 'Sorry, something went wrong answering that. Please try again.' }])
    } finally {
      setChatSending(false)
    }
  }

  const handleDownloadPdf = () => {
    const doc = new jsPDF()
    const marginX = 14
    let y = 20

    doc.setFontSize(18)
    doc.setFont(undefined, 'bold')
    doc.text('TrustGhar — Property Trust Report', marginX, y)
    y += 10

    doc.setFontSize(11)
    doc.setFont(undefined, 'normal')
    doc.text(investigation.propertyAddress || 'Property', marginX, y)
    y += 10

    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text(`Trust Score: ${score} / 100 — ${verdict.label}`, marginX, y)
    y += 8

    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    const verdictLines = doc.splitTextToSize(verdict.desc, 180)
    doc.text(verdictLines, marginX, y)
    y += verdictLines.length * 5 + 6

    doc.setFontSize(13)
    doc.setFont(undefined, 'bold')
    doc.text('Sub-Scores', marginX, y)
    y += 7
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    subScores.forEach((s) => {
      doc.text(`${s.label}: ${s.value} / 100`, marginX, y)
      y += 6
    })
    y += 4

    doc.setFontSize(13)
    doc.setFont(undefined, 'bold')
    doc.text('Key Findings', marginX, y)
    y += 7
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    findings.forEach((f) => {
      const lines = doc.splitTextToSize(`• ${f.text}`, 180)
      if (y + lines.length * 5 > 280) { doc.addPage(); y = 20 }
      doc.text(lines, marginX, y)
      y += lines.length * 5 + 4
    })
    y += 4

    if (investigation.report) {
      if (y > 260) { doc.addPage(); y = 20 }
      doc.setFontSize(13)
      doc.setFont(undefined, 'bold')
      doc.text('Full Report', marginX, y)
      y += 7
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      const reportLines = doc.splitTextToSize(investigation.report, 180)
      reportLines.forEach((line) => {
        if (y > 280) { doc.addPage(); y = 20 }
        doc.text(line, marginX, y)
        y += 5
      })
    }

    doc.save(`${(investigation.propertyAddress || 'trust-report').replace(/[^a-z0-9]/gi, '-')}.pdf`)
  }

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1c1008 0%, #2d1a06 40%, #1a120a 100%)' }}>
        <p className="text-stone-400 text-sm">Loading report...</p>
      </div>
    )
  }

  const isComplete = investigation?.status === 'complete'
  const isFailed = investigation?.status === 'failed'
  const score = investigation?.trustScore || 0
  const scoreColor = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
  const verdict = getVerdict(score)
  const subScores = getSubScores(investigation)
  const findings = getFindings(investigation)

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #1c1008 0%, #2d1a06 40%, #1a120a 100%)' }}>

      <Sidebar active="Investigations" />

      <div className="flex-1 min-w-0">
        <div className="max-w-5xl mx-auto px-8 py-10">

        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-stone-400 hover:text-white text-sm font-medium mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white text-2xl font-extrabold tracking-tight">Trust Report</h1>
            <p className="text-stone-400 text-sm mt-1">{investigation?.propertyAddress}</p>
          </div>
          {isComplete && (
            <button onClick={handleDownloadPdf} className="flex items-center gap-2 text-stone-200 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:bg-white/5" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          )}
        </div>

        {isFailed && (
          <div className="rounded-2xl p-10 text-center mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-stone-200 text-sm font-semibold mb-1">Investigation Failed</p>
            <p className="text-stone-400 text-sm">
              {investigation?.error || 'Something went wrong while analyzing this property. Please try starting a new investigation.'}
            </p>
          </div>
        )}

        {!isComplete && !isFailed && (
          <div className="rounded-2xl p-10 text-center mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Hourglass className="w-8 h-8 text-stone-500 mx-auto mb-3" />
            <p className="text-stone-200 text-sm font-semibold mb-1">Still processing</p>
            <p className="text-stone-400 text-sm">
              AI agents are still analyzing this property. Come back in a few minutes.
            </p>
          </div>
        )}

        {isComplete && (
          <>
            <div className="grid grid-cols-3 gap-6 mb-6">

              {/* Score gauge */}
              <div className="rounded-2xl p-6 flex flex-col items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 -rotate-90">
                    <circle cx="64" cy="64" r="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                    <circle
                      cx="64" cy="64" r="54" fill="none"
                      stroke={scoreColor} strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference * (1 - score / 100)}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-extrabold text-white">{score}</span>
                    <span className="text-stone-500 text-xs">/ 100</span>
                  </div>
                </div>
                <p className={`font-bold text-sm mt-4 ${verdict.color}`}>{verdict.label}</p>
                <p className="text-stone-400 text-xs text-center mt-1">{verdict.desc}</p>
              </div>

              {/* Sub-scores */}
              <div className="col-span-2 rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h2 className="text-white font-bold text-sm mb-5">Score Breakdown</h2>
                <div className="flex flex-col gap-4">
                  {subScores.map((s, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-stone-300 text-sm font-medium">{s.label}</span>
                        <span className="text-stone-200 text-sm font-bold">{s.value}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${s.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Key findings */}
            <div className="grid grid-cols-3 gap-6 mb-6 items-stretch">
              <div className="col-span-2 rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h2 className="text-white font-bold text-sm mb-5">Key Findings</h2>
                <div className="flex flex-col gap-3">
                  {findings.length === 0 && (
                    <p className="text-stone-400 text-sm">No findings available.</p>
                  )}
                  {findings.map((f, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border
                      ${f.type === 'good' ? 'bg-emerald-500/10 border-emerald-500/25'
                        : f.type === 'danger' ? 'bg-red-500/10 border-red-500/25'
                        : 'bg-amber-500/10 border-amber-500/25'}`}>
                      {f.type === 'good'
                        ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        : f.type === 'danger'
                        ? <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        : <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                      <p className="text-stone-200 text-sm leading-relaxed">{f.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <div className="rounded-2xl p-5 flex-1 flex flex-col" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <GitBranch className="w-4 h-4 text-amber-400" />
                    <h3 className="text-white font-bold text-sm">Fraud Network Graph</h3>
                  </div>
                  <p className="text-stone-400 text-xs mb-4 leading-relaxed">
                    Visualize builder connections and detect hidden ownership links.
                  </p>
                  {investigation.fraudGraph?.nodes?.length > 0 ? (
                    <FraudGraph graph={investigation.fraudGraph} />
                  ) : (
                    <p className="text-stone-500 text-xs italic mt-auto">
                      No additional builder network data found for this investigation.
                    </p>
                  )}
                </div>

                <button
                  onClick={handleMonitor}
                  disabled={monitoring}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all
                    ${monitoring
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 cursor-default'
                      : 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20'}`}>
                  <Radio className="w-4 h-4" />
                  {monitoring ? 'Monitoring Active' : 'Monitor This Property'}
                </button>
              </div>
            </div>

            {/* Full AI report */}
            {investigation?.report && (
              <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h2 className="text-white font-bold text-sm mb-4">Full AI Investigation Report</h2>
                <p className="text-stone-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {investigation.report.replace(/^(TRUST_SCORE|RERA_SCORE|FRAUD_SCORE|DOCUMENT_SCORE|VERDICT):.*\n?/gm, '').replace(/^REPORT:\s*/i, '').trim()}
                </p>
              </div>
            )}

            {/* Report Q&A chat */}
            <div className="rounded-2xl p-6 mt-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="w-4 h-4 text-amber-400" />
                <h2 className="text-white font-bold text-sm">Ask About This Report</h2>
              </div>

              <div className="flex flex-col gap-3 max-h-96 overflow-y-auto mb-4 pr-1">
                {chatMessages.length === 0 && (
                  <p className="text-stone-400 text-sm">
                    Ask a question about this investigation — e.g. "why is the fraud score low?" or "what does RERA say about possession delays here?"
                  </p>
                )}
                {chatMessages.map((m) => (
                  <div key={m._id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <p className={`max-w-[75%] text-sm leading-relaxed px-4 py-2.5 rounded-2xl
                      ${m.role === 'user'
                        ? 'bg-amber-500 text-white rounded-br-sm'
                        : 'bg-white/10 text-stone-200 rounded-bl-sm'}`}>
                      {m.text}
                    </p>
                  </div>
                ))}
                {chatSending && (
                  <div className="flex justify-start">
                    <p className="max-w-[75%] text-sm px-4 py-2.5 rounded-2xl rounded-bl-sm bg-white/10 text-stone-400 italic">
                      Thinking...
                    </p>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendChat} className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a question about this report..."
                  disabled={chatSending}
                  className="flex-1 rounded-xl px-4 py-2.5 text-sm text-stone-200 placeholder-stone-500 outline-none focus:border-amber-500/50 disabled:opacity-60"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <button
                  type="submit"
                  disabled={chatSending || !chatInput.trim()}
                  className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2.5 rounded-xl transition-all shrink-0">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  )
}

export default Report
