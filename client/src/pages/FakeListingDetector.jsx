import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck, Bell, LogOut, Link2, Search,
  ShieldAlert, CheckCircle, Loader2, ChevronRight, Trash2
} from 'lucide-react'
import api from '../api/axios'

const verdictStyle = {
  'likely genuine': { badge: 'bg-emerald-100 text-emerald-700' },
  'use caution': { badge: 'bg-amber-100 text-amber-700' },
  'likely fake': { badge: 'bg-red-100 text-red-700' },
}

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

function RedFlagCard({ flag }) {
  return (
    <div className="rounded-xl border p-4 bg-red-50 border-red-100">
      <div className="flex items-center gap-2 mb-2">
        <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
        <span className="text-stone-800 text-sm font-bold">{flag.type}</span>
      </div>
      <p className="text-stone-700 text-xs leading-relaxed">{flag.explanation}</p>
    </div>
  )
}

function ListingCard({ item, onRefresh }) {
  const [expanded, setExpanded] = useState(false)
  const status = item.analysis?.status
  const isAnalyzing = status === 'analyzing'
  const isComplete = status === 'complete'
  const isFailed = status === 'failed'
  const redFlags = item.analysis?.red_flags || []
  const verdict = item.analysis?.verdict || 'use caution'
  const style = verdictStyle[verdict] || verdictStyle['use caution']

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!window.confirm('Delete this listing check?')) return
    try {
      await api.delete(`/listings/${item._id}`)
      onRefresh()
    } catch (err) {
      console.error('Failed to delete listing check:', err)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-stone-50 transition-colors"
        onClick={() => isComplete && setExpanded(e => !e)}
      >
        <div className="bg-indigo-50 p-3 rounded-xl shrink-0">
          <Link2 className="w-4 h-4 text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-stone-800 text-sm font-semibold truncate">{item.url}</p>
          <p className="text-stone-400 text-xs mt-0.5">{formatDate(item.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isAnalyzing && (
            <span className="flex items-center gap-1.5 text-indigo-500 text-xs font-semibold">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking...
            </span>
          )}
          {isComplete && (
            <>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${style.badge}`}>
                {verdict}
              </span>
              <ChevronRight className={`w-4 h-4 text-stone-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </>
          )}
          {isFailed && (
            <span className="text-red-500 text-xs font-semibold">Check failed</span>
          )}
          {!status && (
            <span className="text-stone-400 text-xs">Pending</span>
          )}
          <button onClick={handleDelete} className="text-stone-300 hover:text-red-500 transition-colors p-1" title="Delete check">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isComplete && expanded && (
        <div className="border-t border-stone-100 px-4 pb-4 pt-4">
          {item.analysis?.summary && (
            <div className="bg-stone-50 rounded-xl p-4 mb-4">
              <p className="text-stone-500 text-xs font-semibold uppercase tracking-wider mb-1">AI Summary</p>
              <p className="text-stone-700 text-sm leading-relaxed">{item.analysis.summary}</p>
            </div>
          )}
          {redFlags.length > 0 ? (
            <div className="flex flex-col gap-3">
              <p className="text-stone-500 text-xs font-semibold uppercase tracking-wider">
                {redFlags.length} Red Flag{redFlags.length !== 1 ? 's' : ''} Found
              </p>
              {redFlags.map((flag, i) => (
                <RedFlagCard key={i} flag={flag} />
              ))}
            </div>
          ) : (
            <p className="text-stone-400 text-sm text-center py-4 flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> No red flags found.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function FakeListingDetector() {
  const navigate = useNavigate()
  const [checks, setChecks] = useState([])
  const [loading, setLoading] = useState(true)
  const [url, setUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [userName, setUserName] = useState('')
  const pollRef = useRef(null)

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const fetchChecks = async () => {
    try {
      const res = await api.get('/listings')
      setChecks(res.data)
    } catch (err) {
      console.error('Failed to load listing checks:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChecks()
    api.get('/auth/me')
      .then((res) => setUserName(res.data.name))
      .catch((err) => console.error('Failed to load user:', err))
  }, [])

  useEffect(() => {
    const hasAnalyzing = checks.some(c => c.analysis?.status === 'analyzing')
    if (hasAnalyzing) {
      pollRef.current = setInterval(fetchChecks, 5000)
    } else {
      clearInterval(pollRef.current)
    }
    return () => clearInterval(pollRef.current)
  }, [checks])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!url.trim()) { setError('Please paste a listing URL first.'); return }
    setError('')
    setSubmitting(true)
    try {
      await api.post('/listings/check', { url: url.trim() })
      setUrl('')
      await fetchChecks()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start check. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const checked = checks.filter(c => c.analysis?.status === 'complete').length
  const flagged = checks.filter(c => c.analysis?.status === 'complete' && c.analysis?.red_flags?.length > 0).length

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
                ${item.label === 'Listings' ? 'bg-indigo-500 text-white shadow-sm' : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'}`}>
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
            <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">{userName ? userName[0].toUpperCase() : ''}</div>
            <span className="text-stone-700 text-sm font-medium">{userName}</span>
          </div>
          <button onClick={handleLogout} className="text-stone-400 hover:text-red-500 transition-colors p-1"><LogOut className="w-4 h-4" /></button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-10">

        <div className="mb-8">
          <h1 className="text-stone-900 text-2xl font-extrabold tracking-tight">Fake Listing Detector</h1>
          <p className="text-stone-400 text-sm mt-1">Paste a property listing link to check it for scam warning signs</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Checks', value: checks.length },
            { label: 'Checked', value: checked },
            { label: 'Flagged', value: flagged },
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

            {/* URL form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
              <h2 className="text-stone-900 font-bold text-sm mb-5">Check a Listing</h2>
              <label className="text-stone-500 text-xs font-semibold mb-1.5 block uppercase tracking-wider">Listing URL</label>
              <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste MagicBricks / 99acres / Housing.com URL"
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-stone-700 text-sm outline-none focus:border-indigo-400 transition-colors bg-white mb-4"
              />
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2.5 mb-4">{error}</div>
              )}
              <button type="submit" disabled={submitting} className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-200 disabled:opacity-60">
                <Search className="w-4 h-4" />
                {submitting ? 'Checking...' : 'Check Listing'}
              </button>
            </form>

            {/* Checks list */}
            <div className="flex flex-col gap-3">
              {loading && <p className="text-stone-400 text-sm">Loading checks...</p>}
              {!loading && checks.length === 0 && (
                <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-stone-100">
                  <Link2 className="w-8 h-8 text-stone-300 mx-auto mb-3" />
                  <p className="text-stone-500 text-sm font-semibold mb-1">No listings checked yet</p>
                  <p className="text-stone-400 text-xs">Paste a listing URL above to start AI analysis</p>
                </div>
              )}
              {checks.map((item) => (
                <ListingCard key={item._id} item={item} onRefresh={fetchChecks} />
              ))}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl p-5 border border-indigo-100 flex flex-col" style={{ background: '#eef2ff' }}>
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-4 h-4 text-indigo-500" />
                <h3 className="text-stone-900 font-bold text-sm">How it works</h3>
              </div>
              <p className="text-stone-500 text-xs leading-relaxed">
                Paste a property listing link. The AI reads the real page — price, description, seller details — checks it against common scam patterns, and searches the web for any existing scam reports about the seller or property.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FakeListingDetector
