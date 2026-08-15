import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import api from '../api/axios'

function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await api.post(`/auth/reset-password/${token}`, { password })
      setMessage(res.data.message)
      setDone(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-8 py-12" style={{ background: '#f5ede0' }}>
      <div className="w-full max-w-md rounded-2xl shadow-lg border border-stone-200 p-10" style={{ background: '#fdf8f2' }}>

        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="bg-amber-500 p-1.5 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-stone-800 text-xl font-bold">TrustGhar</span>
        </div>

        <h2 className="text-stone-900 text-2xl font-bold text-center mb-1">Set a new password</h2>
        <p className="text-stone-500 text-center text-sm mb-6">Choose a new password for your account</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2.5 mb-4">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-2.5 mb-4">
            {message}
          </div>
        )}

        {!done && (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="text-stone-700 text-sm font-medium mb-1.5 block">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} placeholder="Enter new password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-lg px-4 py-3 pr-10 text-stone-900 outline-none focus:border-amber-500 transition-colors text-sm"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-stone-400">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="mb-6">
              <label className="text-stone-700 text-sm font-medium mb-1.5 block">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'} placeholder="Confirm new password"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-lg px-4 py-3 text-stone-900 outline-none focus:border-amber-500 transition-colors text-sm"
              />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg font-semibold transition-colors text-sm tracking-wide disabled:opacity-60">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default ResetPassword
