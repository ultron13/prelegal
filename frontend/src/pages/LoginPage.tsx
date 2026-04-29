import { useState } from 'react'
import { Scale } from 'lucide-react'
import { login, register } from '@/lib/api'

type Tab = 'signin' | 'signup'

interface LoginPageProps {
  onLogin: (token: string, email: string) => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [tab, setTab] = useState<Tab>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (tab === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const result = tab === 'signin'
        ? await login(email, password)
        : await register(email, password)
      onLogin(result.access_token, result.email)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const switchTab = (t: Tab) => {
    setTab(t)
    setError('')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#4A90E2] mb-4">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#333333]">PreLegal</h1>
          <p className="text-sm text-slate-500 mt-1">Professional legal document platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex border-b border-slate-200">
            {(['signin', 'signup'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  tab === t
                    ? 'text-[#4A90E2] border-b-2 border-[#4A90E2] bg-blue-50/50'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#333333] bg-white focus:outline-none focus:ring-2 focus:ring-[#4A90E2] hover:border-slate-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#333333] bg-white focus:outline-none focus:ring-2 focus:ring-[#4A90E2] hover:border-slate-400 transition-colors"
                />
              </div>

              {tab === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#333333] bg-white focus:outline-none focus:ring-2 focus:ring-[#4A90E2] hover:border-slate-400 transition-colors"
                  />
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#4A90E2] hover:bg-blue-600 active:bg-blue-700 disabled:opacity-60 text-white py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm mt-2"
              >
                {loading
                  ? tab === 'signin' ? 'Signing in…' : 'Creating account…'
                  : tab === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          By continuing you agree that documents generated are drafts subject to legal review.
        </p>
      </div>
    </div>
  )
}
