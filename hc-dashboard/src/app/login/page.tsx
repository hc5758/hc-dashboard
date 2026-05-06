'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Lock, Mail, AlertCircle, ShieldOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const noAccess = searchParams.get('error') === 'no_access'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email atau password salah. Silakan coba lagi.')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1e3d] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-500 text-[#0f1e3d] font-black text-xl mb-4">
            5758
          </div>
          <h1 className="text-white text-xl font-bold">Portal Internal HC</h1>
          <p className="text-white/40 text-sm mt-1">5758 Creative Lab · 2026</p>
        </div>

        {/* Form */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <h2 className="text-white font-semibold text-base mb-5">Masuk ke dashboard</h2>

          {noAccess && (
            <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs rounded-lg px-3 py-2.5 mb-4">
              <ShieldOff size={14} />
              Akun ini tidak memiliki akses ke portal HC. Hubungi admin HR.
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg px-3 py-2.5 mb-4">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-white/50 text-xs font-medium block mb-1.5">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@5758.co"
                  required
                  className="w-full bg-white/8 border border-white/10 rounded-lg pl-9 pr-3 py-2.5
                             text-white text-sm placeholder:text-white/25 outline-none
                             focus:border-teal-400/50 focus:bg-white/10 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-white/50 text-xs font-medium block mb-1.5">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/8 border border-white/10 rounded-lg pl-9 pr-10 py-2.5
                             text-white text-sm placeholder:text-white/25 outline-none
                             focus:border-teal-400/50 focus:bg-white/10 transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-[#0f1e3d]
                         font-bold text-sm py-2.5 rounded-lg transition-colors mt-2"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          Akses hanya untuk tim HR 5758 Creative Lab
        </p>
      </div>
    </div>
  )
}
