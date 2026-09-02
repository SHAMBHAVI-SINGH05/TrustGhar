import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Link, ChevronDown, Zap, FileSearch, Brain, BarChart3, ArrowRight, Search } from 'lucide-react'
import api from '../api/axios'
import Sidebar from '../components/Sidebar'

const indianStates = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
]

const investigationTypes = [
  { id: 'full', label: 'Full Analysis', desc: 'All AI agents — RERA scraping, fraud graph, document check, trust score report', icon: <Brain className="w-5 h-5" />, time: '3–5 min', recommended: true },
  { id: 'quick', label: 'Quick Check', desc: 'RERA verification + basic trust score only. Faster but less detailed.', icon: <Zap className="w-5 h-5" />, time: '~1 min', recommended: false },
  { id: 'document', label: 'Document Only', desc: 'Skip RERA scraping. Upload your own documents for AI analysis.', icon: <FileSearch className="w-5 h-5" />, time: '~2 min', recommended: false },
]

const agents = [
  { icon: <Search className="w-4 h-4 text-amber-400" />, name: 'RERA Scraper Agent', desc: 'Fetches live data from state RERA portal' },
  { icon: <Brain className="w-4 h-4 text-amber-400" />, name: 'Fraud Detector Agent', desc: 'Builds knowledge graph, finds hidden links' },
  { icon: <FileSearch className="w-4 h-4 text-amber-400" />, name: 'Document Analyzer Agent', desc: 'Extracts clauses & red flags from PDFs' },
  { icon: <BarChart3 className="w-4 h-4 text-amber-400" />, name: 'Report Generator Agent', desc: 'Compiles trust score & final report' },
]

function NewInvestigation() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ address: '', listingUrl: '', state: '', type: 'full' })
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [platformStats, setPlatformStats] = useState(null)

  useEffect(() => {
    api.get('/dashboard/platform-stats')
      .then((res) => setPlatformStats(res.data))
      .catch((err) => console.error('Failed to load platform stats:', err))
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const handleType = (id) => setForm({ ...form, type: id })

  const handleStart = async () => {
    setError('')
    if (form.type === 'document' && !file) {
      setError('Please upload a PDF document for Document Only analysis.')
      return
    }
    setSubmitting(true)
    try {
      let res
      if (form.type === 'document') {
        const formData = new FormData()
        formData.append('propertyAddress', form.address)
        formData.append('listingUrl', form.listingUrl)
        formData.append('state', form.state)
        formData.append('type', form.type)
        formData.append('file', file)
        res = await api.post('/investigations', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        res = await api.post('/investigations', {
          propertyAddress: form.address,
          listingUrl: form.listingUrl,
          state: form.state,
          type: form.type,
        })
      }
      navigate(`/investigate/live/${res.data.investigationId}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start investigation. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #1c1008 0%, #2d1a06 40%, #1a120a 100%)' }}>

      <Sidebar active="Investigations" />

      <div className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-8 py-10">
          <div className="mb-8">
            <h1 className="text-white text-2xl font-extrabold tracking-tight">New Investigation</h1>
            <p className="text-stone-400 text-sm mt-1">Enter property details to start an AI-powered trust analysis</p>
          </div>

          <div className="grid grid-cols-3 gap-8 items-stretch">

            {/* Left — Form */}
            <div className="col-span-2 flex flex-col gap-5">

              {/* Property Details */}
              <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h2 className="text-white font-bold text-sm mb-5">Property Details</h2>

                <div className="mb-4">
                  <label className="text-stone-500 text-xs font-semibold mb-1.5 block uppercase tracking-wider">Property Address <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-500" />
                    <input type="text" name="address" value={form.address} onChange={handleChange}
                      placeholder="e.g. Prestige Towers, Whitefield, Bangalore"
                      className="w-full rounded-xl pl-10 pr-4 py-3 text-white text-sm outline-none focus:border-amber-500/50 transition-colors placeholder:text-stone-600"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-stone-500 text-xs font-semibold mb-1.5 block uppercase tracking-wider">Listing URL <span className="text-stone-600 normal-case font-normal">(optional)</span></label>
                  <div className="relative">
                    <Link className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-500" />
                    <input type="url" name="listingUrl" value={form.listingUrl} onChange={handleChange}
                      placeholder="Paste MagicBricks / 99acres / Housing.com URL"
                      className="w-full rounded-xl pl-10 pr-4 py-3 text-white text-sm outline-none focus:border-amber-500/50 transition-colors placeholder:text-stone-600"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-stone-500 text-xs font-semibold mb-1.5 block uppercase tracking-wider">State <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <ChevronDown className="absolute right-3.5 top-3.5 w-4 h-4 text-stone-500 pointer-events-none" />
                    <select name="state" value={form.state} onChange={handleChange}
                      className="w-full rounded-xl px-4 py-3 text-stone-200 text-sm outline-none appearance-none focus:border-amber-500/50 transition-colors"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <option value="" className="bg-stone-900">Select state for RERA lookup</option>
                      {indianStates.map((s) => <option key={s} value={s} className="bg-stone-900">{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Investigation Type */}
              <div className="rounded-2xl p-6 flex-1 flex flex-col" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h2 className="text-white font-bold text-sm mb-5">Investigation Type</h2>
                <div className="flex flex-col gap-3">
                  {investigationTypes.map((t) => (
                    <button key={t.id} onClick={() => handleType(t.id)}
                      className={`flex items-start gap-4 p-4 rounded-xl text-left transition-all border
                        ${form.type === t.id
                          ? 'bg-amber-500/10 border-amber-500/40'
                          : 'border-white/10 hover:border-white/20'}`}>
                      <div className={`p-2 rounded-lg mt-0.5 ${form.type === t.id ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-stone-500 border border-white/10'}`}>
                        {t.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-bold ${form.type === t.id ? 'text-amber-400' : 'text-stone-200'}`}>{t.label}</span>
                          {t.recommended && <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">Recommended</span>}
                          <span className="ml-auto text-xs text-stone-500">{t.time}</span>
                        </div>
                        <p className="text-stone-500 text-xs leading-relaxed">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {form.type === 'document' && (
                <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <h2 className="text-white font-bold text-sm mb-1">Upload Document</h2>
                  <p className="text-stone-500 text-xs mb-4">Upload the sale deed / RERA certificate PDF you want analyzed</p>
                  <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])}
                    className="w-full rounded-xl px-4 py-3 text-stone-400 text-sm outline-none focus:border-amber-500/50 transition-colors file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-amber-500/15 file:text-amber-400 file:text-xs file:font-semibold"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
              )}

              {error && (
                <div className="text-sm rounded-xl px-4 py-2.5" style={{ background: 'rgba(127,29,29,0.25)', border: '1px solid rgba(248,113,113,0.3)', color: '#fca5a5' }}>
                  {error}
                </div>
              )}

              <button onClick={handleStart} disabled={submitting} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-2xl font-bold text-base transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-3 disabled:opacity-60">
                <Brain className="w-5 h-5" />
                {submitting ? 'Starting...' : 'Start AI Investigation'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Right — Info */}
            <div className="flex flex-col gap-5">

              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 className="text-white font-bold text-sm mb-1">What happens next?</h3>
                <p className="text-stone-500 text-xs mb-4">AI agents run in sequence and report back</p>
                <div className="flex flex-col gap-2.5">
                  {agents.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="bg-amber-500/10 p-1.5 rounded-lg shrink-0">{a.icon}</div>
                      <p className="text-stone-200 text-xs font-semibold">{a.name}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 className="text-stone-200 font-bold text-sm mb-4">Tips for better results</h3>
                <div className="flex flex-col gap-3">
                  {[
                    'Include full address with city and pincode',
                    'Adding a listing URL helps the scraper find exact RERA details',
                    'Select correct state — each state has a separate RERA portal',
                    'Full Analysis gives the most complete fraud detection',
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <p className="text-stone-500 text-xs leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl p-5 flex-1 flex flex-col justify-center" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <p className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">Platform Stats</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: platformStats?.propertiesInvestigated ?? '—', label: 'Properties investigated' },
                    { value: platformStats?.documentsAnalyzed ?? '—', label: 'Documents analyzed' },
                    { value: platformStats?.listingsChecked ?? '—', label: 'Listings checked' },
                    { value: platformStats?.propertiesMonitored ?? '—', label: 'Properties monitored' },
                  ].map((s, i) => (
                    <div key={i}>
                      <p className="text-stone-200 font-extrabold text-lg">{s.value}</p>
                      <p className="text-stone-500 text-xs">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewInvestigation
