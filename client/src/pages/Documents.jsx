import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Bell, LogOut, Upload, FileText, ChevronDown, FileCheck2, Scale, Key, FileSignature, ShieldQuestion } from 'lucide-react'
import api from '../api/axios'

const documentTypes = ['Sale Deed', 'RERA Certificate', 'Allotment Letter', 'Possession Letter', 'Other']

const docTypeInfo = [
  { icon: FileSignature, label: 'Sale Deed', desc: 'Checked for predatory clauses, ownership terms, and payment conditions' },
  { icon: FileCheck2, label: 'RERA Certificate', desc: 'Verified against the state RERA portal for authenticity' },
  { icon: Key, label: 'Allotment Letter', desc: 'Cross-checked for unit details and promised possession date' },
  { icon: Scale, label: 'Possession Letter', desc: 'Compared against actual possession date for delays' },
]

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

function Documents() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [file, setFile] = useState(null)
  const [docType, setDocType] = useState(documentTypes[0])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const fetchDocuments = () => {
    api.get('/documents')
      .then((res) => setDocuments(res.data))
      .catch((err) => console.error('Failed to load documents:', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Please choose a file first.')
      return
    }
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
      fetchDocuments()
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

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
          <p className="text-stone-400 text-sm mt-1">Upload property documents for AI analysis</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Documents', value: documents.length },
            { label: 'Analyzed', value: documents.filter((d) => d.analysis && Object.keys(d.analysis).length > 0).length },
            { label: 'Pending Analysis', value: documents.filter((d) => !d.analysis || Object.keys(d.analysis).length === 0).length },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
              <p className="text-stone-900 text-3xl font-extrabold tracking-tight">{s.value}</p>
              <p className="text-stone-400 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6 items-stretch">

          {/* Left column */}
          <div className="col-span-2 flex flex-col gap-5">

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
                  <label className="text-stone-500 text-xs font-semibold mb-1.5 block uppercase tracking-wider">File</label>
                  <input type="file" onChange={(e) => setFile(e.target.files[0])}
                    className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-stone-600 text-sm outline-none focus:border-indigo-400 transition-colors bg-white file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-600 file:text-xs file:font-semibold"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2.5 mb-4">
                  {error}
                </div>
              )}

              <button type="submit" disabled={uploading} className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-200 disabled:opacity-60">
                <Upload className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Upload Document'}
              </button>
            </form>

            {/* Document list */}
            <div className="flex flex-col gap-3 flex-1">
              {loading && (
                <p className="text-stone-400 text-sm">Loading documents...</p>
              )}
              {!loading && documents.length === 0 && (
                <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-stone-100 flex-1 flex flex-col items-center justify-center">
                  <FileText className="w-8 h-8 text-stone-300 mx-auto mb-3" />
                  <p className="text-stone-500 text-sm">No documents uploaded yet.</p>
                </div>
              )}
              {documents.map((doc) => (
                <div key={doc._id} className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
                  <div className="bg-indigo-50 p-3 rounded-xl shrink-0">
                    <FileText className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-stone-800 text-sm font-semibold">{doc.fileName}</p>
                    <p className="text-stone-400 text-xs mt-0.5">{doc.fileType} · {formatDate(doc.createdAt)}</p>
                  </div>
                  <span className="text-stone-400 text-xs font-medium shrink-0">Analysis pending</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — info sidebar */}
          <div className="flex flex-col gap-5">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
              <h3 className="text-stone-900 font-bold text-sm mb-1">What gets checked?</h3>
              <p className="text-stone-400 text-xs mb-4">Each document type is analyzed differently</p>
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

            <div className="rounded-2xl p-5 border border-indigo-100 flex-1 flex flex-col" style={{ background: '#eef2ff' }}>
              <div className="flex items-center gap-2 mb-2">
                <ShieldQuestion className="w-4 h-4 text-indigo-500" />
                <h3 className="text-stone-900 font-bold text-sm">Why upload documents?</h3>
              </div>
              <p className="text-stone-500 text-xs leading-relaxed">
                The Document Analyzer Agent reads your uploads and flags risky clauses, mismatched dates, and missing details — catching issues a manual read-through might miss. Analysis runs once the AI service is connected.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Documents
