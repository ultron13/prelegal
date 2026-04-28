import { useState } from 'react'
import { Scale } from 'lucide-react'

interface LoginPageProps {
  onLogin: () => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email && password) {
      onLogin()
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#4A90E2] mb-4">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#333333]">PreLegal</h1>
          <p className="text-sm text-slate-500 mt-1">Legal document platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-base font-semibold text-[#333333] mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#333333] bg-white focus:outline-none focus:ring-2 focus:ring-[#4A90E2] hover:border-slate-400 transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#4A90E2] hover:bg-blue-600 active:bg-blue-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm mt-2"
            >
              Sign in
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Demo environment — any credentials accepted
        </p>
      </div>
    </div>
  )
}
