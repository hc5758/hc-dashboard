'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
    if (res.ok) {
      router.push('/dashboard')
      router.refresh()
    } else {
      setError('Password salah. Coba lagi.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-teal-400 rounded-2xl flex items-center justify-center
                          text-navy-800 font-extrabold text-sm mx-auto mb-4">
            5758
          </div>
          <h1 className="text-white text-xl font-bold">HC Analytics Dashboard</h1>
          <p className="text-white/30 text-sm mt-1">5758 Creative Lab · Internal</p>
        </div>

        {/* Form */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-7">
          <h2 className="text-white font-semibold text-base mb-6">Masuk ke dashboard</h2>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20
                            text-red-400 text-xs rounded-lg px-3 py-2.5 mb-4">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="form-label text-white/50">Password</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={pw}
                  onChange={e => setPw(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  className="w-full bg-white/8 border border-white/12 rounded-xl px-4 py-3
                             text-white text-sm placeholder:text-white/25
                             outline-none focus:border-teal-400/50 transition-all pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-400 hover:bg-teal-300 disabled:opacity-50
                         text-navy-800 font-bold text-sm py-3 rounded-xl transition-colors"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          Akses hanya untuk tim HC 5758 Creative Lab
        </p>
      </div>
    </div>
  )
}
