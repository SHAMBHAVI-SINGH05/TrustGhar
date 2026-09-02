import { useState, useEffect, useRef } from 'react'
import {
  Upload, FileText, ChevronDown,
  FileCheck2, Scale, Key, FileSignature, ShieldQuestion,
  AlertTriangle, CheckCircle, XCircle, Loader2, ChevronRight, ShieldOff, Trash2
} from 'lucide-react'
import api from '../api/axios'
import Sidebar from '../components/Sidebar'

const documentTypes = ['Sale Deed', 'RERA Certificate', 'Allotment Letter', 'Possession Letter', 'Other']

const docTypeInfo = [
  { icon: FileSignature, label: 'Sale Deed', desc: 'Checked for predatory clauses, ownership terms, and payment conditions' },
  { icon: FileCheck2, label: 'RERA Certificate', desc: 'Verified against the state RERA portal for authenticity' },
  { icon: Key, label: 'Allotment Letter', desc: 'Cross-checked for unit details and promised possession date' },
  { icon: Scale, label: 'Possession Letter', desc: 'Compared against actual possession date for delays' },
]

const riskColor = {
  high: { bg: 'bg-red-500/10', border: 'border-red-500/25', badge: 'bg-red-500/20 text-red-400', icon: XCircle, iconColor: 'text-red-400' },
  medium: { bg: 'bg-amber-500/10', border: 'border-amber-500/25', badge: 'bg-amber-500/20 text-amber-400', icon: AlertTriangle, iconColor: 'text-amber-400' },
  low: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', badge: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle, iconColor: 'text-emerald-400' },
}

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

function ClauseCard({ clause }) {
  const risk = riskColor[clause.risk] || riskColor.medium
  const Icon = risk.icon
  return (
    <div className={`rounded-xl border p-4 ${risk.bg} ${risk.border}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 shrink-0 ${risk.iconColor}`} />
          <span className="text-stone-200 text-sm font-bold">{clause.type}</span>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${risk.badge}`}>
          {clause.risk?.toUpperCase()} RISK
        </span>
      </div>
      {clause.text && (
        <p className="text-stone-400 text-xs italic border-l-2 border-white/15 pl-3 mb-2 leading-relaxed">
          "{clause.text}"
        </p>
      )}
      <p className="text-stone-300 text-xs leading-relaxed mb-1">{clause.explanation}</p>
      {clause.rera_section && (
        <p className="text-amber-400 text-xs font-medium mt-1">📋 {clause.rera_section}</p>
      )}
    </div>
  )
}

function MissingProtectionCard({ item }) {
  return (
    <div className="rounded-xl border p-4 bg-white/5 border-white/10">
      <div className="flex items-center gap-2 mb-2">
        <ShieldOff className="w-4 h-4 shrink-0 text-stone-500" />
        <span className="text-stone-200 text-sm font-bold">{item.type}</span>
      </div>
      <p className="text-stone-400 text-xs leading-relaxed">{item.explanation}</p>
    </div>
  )
}

function DocumentCard({ doc, onRefresh }) {
  const [expanded, setExpanded] = useState(false)
  const status = doc.analysis?.status
  const isAnalyzing = status === 'analyzing'
  const isComplete = status === 'complete'
  const isFailed = status === 'failed'
  const clauses = doc.analysis?.clauses || []
  const missingProtections = doc.analysis?.missing_protections || []

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!window.confirm('Delete this document?')) return
    try {
      await api.delete(`/documents/${doc._id}`)
      onRefresh()
    } catch (err) {
      console.error('Failed to delete document:', err)
    }
  }
  const overallRisk = doc.analysis?.overall_risk || 'medium'
  const riskStyle = riskColor[overallRisk] || riskColor.medium

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => isComplete && setExpanded(e => !e)}
      >
        <div className="bg-amber-500/10 p-3 rounded-xl shrink-0">
          <FileText className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-stone-200 text-sm font-semibold truncate">{doc.fileName}</p>
          <p className="text-stone-500 text-xs mt-0.5">{doc.fileType} · {formatDate(doc.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isAnalyzing && (
            <span className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing...
            </span>
          )}
          {isComplete && (
            <>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${riskStyle.badge}`}>
                {overallRisk?.toUpperCase()} RISK
              </span>
              <ChevronRight className={`w-4 h-4 text-stone-500 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </>
          )}
          {isFailed && (
            <span className="text-red-400 text-xs font-semibold">Analysis failed</span>
          )}
          {!status && (
            <span className="text-stone-500 text-xs">Pending</span>
          )}
          <button onClick={handleDelete} className="text-stone-600 hover:text-red-400 transition-colors p-1" title="Delete document">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isComplete && expanded && (
        <div className="px-4 pb-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {doc.analysis?.summary && (
            <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <p className="text-stone-500 text-xs font-semibold uppercase tracking-wider mb-1">AI Summary</p>
              <p className="text-stone-200 text-sm leading-relaxed">{doc.analysis.summary}</p>
            </div>
          )}
          {clauses.length > 0 ? (
            <div className="flex flex-col gap-3">
              <p className="text-stone-500 text-xs font-semibold uppercase tracking-wider">
                {clauses.length} Clause{clauses.length !== 1 ? 's' : ''} Analyzed
              </p>
              {clauses.map((clause, i) => (
                <ClauseCard key={i} clause={clause} />
              ))}
            </div>
          ) : (
            <p className="text-stone-500 text-sm text-center py-4">No specific clauses identified.</p>
          )}
          {missingProtections.length > 0 && (
            <div className="flex flex-col gap-3 mt-4">
              <p className="text-stone-500 text-xs font-semibold uppercase tracking-wider">
                Missing Buyer Protections
              </p>
              {missingProtections.map((item, i) => (
                <MissingProtectionCard key={i} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Documents() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [file, setFile] = useState(null)
  const [docType, setDocType] = useState(documentTypes[0])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const pollRef = useRef(null)

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents')
      setDocuments(res.data)
    } catch (err) {
      console.error('Failed to load documents:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  // Poll while any document is still analyzing
  useEffect(() => {
    const hasAnalyzing = documents.some(d => d.analysis?.status === 'analyzing')
    if (hasAnalyzing) {
      pollRef.current = setInterval(fetchDocuments, 5000)
    } else {
      clearInterval(pollRef.current)
    }
    return () => clearInterval(pollRef.current)
  }, [documents])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) { setError('Please choose a file first.'); return }
    setError('')
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', docType)
      await api.post('/documents/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setFile(null)
      await fetchDocuments()
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const analyzed = documents.filter(d => d.analysis?.status === 'complete').length
  const analyzing = documents.filter(d => d.analysis?.status === 'analyzing').length

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #1c1008 0%, #2d1a06 40%, #1a120a 100%)' }}>

      <Sidebar active="Documents" />

      <div className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-8 py-10">

        <div className="mb-8">
          <h1 className="text-white text-2xl font-extrabold tracking-tight">Documents</h1>
          <p className="text-stone-400 text-sm mt-1">Upload property documents for AI clause analysis</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Documents', value: documents.length },
            { label: 'Analyzed', value: analyzed },
            { label: 'Analyzing', value: analyzing },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-white text-3xl font-extrabold tracking-tight">{s.value}</p>
              <p className="text-stone-400 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* Left column */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Upload card */}
            <form onSubmit={handleUpload} className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="text-white font-bold text-sm mb-5">Upload a Document</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-stone-500 text-xs font-semibold mb-1.5 block uppercase tracking-wider">Document Type</label>
                  <div className="relative">
                    <ChevronDown className="absolute right-3.5 top-3.5 w-4 h-4 text-stone-500 pointer-events-none" />
                    <select value={docType} onChange={(e) => setDocType(e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-stone-200 text-sm outline-none appearance-none focus:border-amber-500/50 transition-colors"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {documentTypes.map((t) => <option key={t} value={t} className="bg-stone-900">{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-stone-500 text-xs font-semibold mb-1.5 block uppercase tracking-wider">PDF File</label>
                  <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])}
                    className="w-full rounded-xl px-4 py-3 text-stone-400 text-sm outline-none focus:border-amber-500/50 transition-colors file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-amber-500/15 file:text-amber-400 file:text-xs file:font-semibold"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
              </div>
              {error && (
                <div className="text-sm rounded-xl px-4 py-2.5 mb-4" style={{ background: 'rgba(127,29,29,0.25)', border: '1px solid rgba(248,113,113,0.3)', color: '#fca5a5' }}>{error}</div>
              )}
              <button type="submit" disabled={uploading} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-60">
                <Upload className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Upload & Analyze'}
              </button>
            </form>

            {/* Document list */}
            <div className="flex flex-col gap-3">
              {loading && <p className="text-stone-400 text-sm">Loading documents...</p>}
              {!loading && documents.length === 0 && (
                <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <FileText className="w-8 h-8 text-stone-600 mx-auto mb-3" />
                  <p className="text-stone-300 text-sm font-semibold mb-1">No documents yet</p>
                  <p className="text-stone-500 text-xs">Upload a PDF sale deed above to start AI analysis</p>
                </div>
              )}
              {documents.map((doc) => (
                <DocumentCard key={doc._id} doc={doc} onRefresh={fetchDocuments} />
              ))}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="text-white font-bold text-sm mb-1">What gets checked?</h3>
              <p className="text-stone-500 text-xs mb-4">Each document is analyzed for risky clauses</p>
              <div className="flex flex-col gap-4">
                {docTypeInfo.map((d, i) => {
                  const Icon = d.icon
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className="bg-amber-500/10 p-2 rounded-lg shrink-0">
                        <Icon className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-stone-200 text-xs font-semibold">{d.label}</p>
                        <p className="text-stone-500 text-xs mt-0.5">{d.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-2xl p-5 flex flex-col" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div className="flex items-center gap-2 mb-2">
                <ShieldQuestion className="w-4 h-4 text-amber-400" />
                <h3 className="text-white font-bold text-sm">How it works</h3>
              </div>
              <p className="text-stone-400 text-xs leading-relaxed">
                Upload your sale deed PDF. The AI extracts all text, identifies key clauses, checks each one against the RERA Act using a legal database, and flags anything that could harm you as a buyer.
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

export default Documents
