import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck, Bell, LogOut, Upload, FileText, ChevronDown,
  FileCheck2, Scale, Key, FileSignature, ShieldQuestion,
  AlertTriangle, CheckCircle, XCircle, Loader2, ChevronRight, ShieldOff, Trash2
} from 'lucide-react'
import api from '../api/axios'

const documentTypes = ['Sale Deed', 'RERA Certificate', 'Allotment Letter', 'Possession Letter', 'Other']

const docTypeInfo = [
  { icon: FileSignature, label: 'Sale Deed', desc: 'Checked for predatory clauses, ownership terms, and payment conditions' },
  { icon: FileCheck2, label: 'RERA Certificate', desc: 'Verified against the state RERA portal for authenticity' },
  { icon: Key, label: 'Allotment Letter', desc: 'Cross-checked for unit details and promised possession date' },
  { icon: Scale, label: 'Possession Letter', desc: 'Compared against actual possession date for delays' },
]

const riskColor = {
  high: { bg: 'bg-red-50', border: 'border-red-100', badge: 'bg-red-100 text-red-700', icon: XCircle, iconColor: 'text-red-500' },
  medium: { bg: 'bg-amber-50', border: 'border-amber-100', badge: 'bg-amber-100 text-amber-700', icon: AlertTriangle, iconColor: 'text-amber-500' },
  low: { bg: 'bg-emerald-50', border: 'border-emerald-100', badge: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, iconColor: 'text-emerald-500' },
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
          <span className="text-stone-800 text-sm font-bold">{clause.type}</span>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${risk.badge}`}>
          {clause.risk?.toUpperCase()} RISK
        </span>
      </div>
      {clause.text && (
        <p className="text-stone-500 text-xs italic border-l-2 border-stone-300 pl-3 mb-2 leading-relaxed">
          "{clause.text}"
        </p>
      )}
      <p className="text-stone-700 text-xs leading-relaxed mb-1">{clause.explanation}</p>
      {clause.rera_section && (
        <p className="text-indigo-600 text-xs font-medium mt-1">📋 {clause.rera_section}</p>
      )}
    </div>
  )
}

function MissingProtectionCard({ item }) {
  return (
    <div className="rounded-xl border p-4 bg-stone-50 border-stone-200">
      <div className="flex items-center gap-2 mb-2">
        <ShieldOff className="w-4 h-4 shrink-0 text-stone-400" />
        <span className="text-stone-800 text-sm font-bold">{item.type}</span>
      </div>
      <p className="text-stone-600 text-xs leading-relaxed">{item.explanation}</p>
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
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-stone-50 transition-colors"
        onClick={() => isComplete && setExpanded(e => !e)}
      >
        <div className="bg-indigo-50 p-3 rounded-xl shrink-0">
          <FileText className="w-4 h-4 text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-stone-800 text-sm font-semibold truncate">{doc.fileName}</p>
          <p className="text-stone-400 text-xs mt-0.5">{doc.fileType} · {formatDate(doc.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isAnalyzing && (
            <span className="flex items-center gap-1.5 text-indigo-500 text-xs font-semibold">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing...
            </span>
          )}
          {isComplete && (
            <>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${riskStyle.badge}`}>
                {overallRisk?.toUpperCase()} RISK
              </span>
              <ChevronRight className={`w-4 h-4 text-stone-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </>
          )}
          {isFailed && (
            <span className="text-red-500 text-xs font-semibold">Analysis failed</span>
          )}
          {!status && (
            <span className="text-stone-400 text-xs">Pending</span>
          )}
          <button onClick={handleDelete} className="text-stone-300 hover:text-red-500 transition-colors p-1" title="Delete document">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isComplete && expanded && (
        <div className="border-t border-stone-100 px-4 pb-4 pt-4">
          {doc.analysis?.summary && (
            <div className="bg-stone-50 rounded-xl p-4 mb-4">
              <p className="text-stone-500 text-xs font-semibold uppercase tracking-wider mb-1">AI Summary</p>
              <p className="text-stone-700 text-sm leading-relaxed">{doc.analysis.summary}</p>
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
            <p className="text-stone-400 text-sm text-center py-4">No specific clauses identified.</p>
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
  const navigate = useNavigate()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [file, setFile] = useState(null)
  const [docType, setDocType] = useState(documentTypes[0])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const pollRef = useRef(null)

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

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
                ${item.label === 'Documents' ? 'bg-indigo-500 text-white shadow-sm' : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'}`}>
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
            <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">S</div>
            <span className="text-stone-700 text-sm font-medium">Shambhavi</span>
          </div>
          <button onClick={handleLogout} className="text-stone-400 hover:text-red-500 transition-colors p-1"><LogOut className="w-4 h-4" /></button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-10">

        <div className="mb-8">
          <h1 className="text-stone-900 text-2xl font-extrabold tracking-tight">Documents</h1>
          <p className="text-stone-400 text-sm mt-1">Upload property documents for AI clause analysis</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Documents', value: documents.length },
            { label: 'Analyzed', value: analyzed },
            { label: 'Analyzing', value: analyzing },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
              <p className="text-stone-900 text-3xl font-extrabold tracking-tight">{s.value}</p>
              <p className="text-stone-400 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* Left column */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Upload card */}
            <form onSubmit={handleUpload} className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
              <h2 className="text-stone-900 font-bold text-sm mb-5">Upload a Document</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-stone-500 text-xs font-semibold mb-1.5 block uppercase tracking-wider">Document Type</label>
                  <div className="relative">
                    <ChevronDown className="absolute right-3.5 top-3.5 w-4 h-4 text-stone-300 pointer-events-none" />
                    <select value={docType} onChange={(e) => setDocType(e.target.value)}
                      className="w-full border border-stone-200 rounded-xl px-4 py-3 text-stone-700 text-sm outline-none appearance-none focus:border-indigo-400 transition-colors bg-white">
                      {documentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-stone-500 text-xs font-semibold mb-1.5 block uppercase tracking-wider">PDF File</label>
                  <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])}
                    className="w-full border border-stone-200 rounded-xl px-4 py-3 text-stone-600 text-sm outline-none focus:border-indigo-400 transition-colors bg-white file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-600 file:text-xs file:font-semibold"
                  />
                </div>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2.5 mb-4">{error}</div>
              )}
              <button type="submit" disabled={uploading} className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-200 disabled:opacity-60">
                <Upload className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Upload & Analyze'}
              </button>
            </form>

            {/* Document list */}
            <div className="flex flex-col gap-3">
              {loading && <p className="text-stone-400 text-sm">Loading documents...</p>}
              {!loading && documents.length === 0 && (
                <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-stone-100">
                  <FileText className="w-8 h-8 text-stone-300 mx-auto mb-3" />
                  <p className="text-stone-500 text-sm font-semibold mb-1">No documents yet</p>
                  <p className="text-stone-400 text-xs">Upload a PDF sale deed above to start AI analysis</p>
                </div>
              )}
              {documents.map((doc) => (
                <DocumentCard key={doc._id} doc={doc} onRefresh={fetchDocuments} />
              ))}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="flex flex-col gap-5">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
              <h3 className="text-stone-900 font-bold text-sm mb-1">What gets checked?</h3>
              <p className="text-stone-400 text-xs mb-4">Each document is analyzed for risky clauses</p>
              <div className="flex flex-col gap-4">
                {docTypeInfo.map((d, i) => {
                  const Icon = d.icon
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className="bg-indigo-50 p-2 rounded-lg shrink-0">
                        <Icon className="w-4 h-4 text-indigo-500" />
                      </div>
                      <div>
                        <p className="text-stone-700 text-xs font-semibold">{d.label}</p>
                        <p className="text-stone-400 text-xs mt-0.5">{d.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-2xl p-5 border border-indigo-100 flex flex-col" style={{ background: '#eef2ff' }}>
              <div className="flex items-center gap-2 mb-2">
                <ShieldQuestion className="w-4 h-4 text-indigo-500" />
                <h3 className="text-stone-900 font-bold text-sm">How it works</h3>
              </div>
              <p className="text-stone-500 text-xs leading-relaxed">
                Upload your sale deed PDF. The AI extracts all text, identifies key clauses, checks each one against the RERA Act using a legal database, and flags anything that could harm you as a buyer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Documents
