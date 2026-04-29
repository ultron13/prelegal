import { useState } from 'react'
import { LoginPage } from './pages/LoginPage'
import { HomePage } from './pages/HomePage'

interface AuthState {
  token: string
  email: string
}

function loadAuth(): AuthState | null {
  try {
    const stored = localStorage.getItem('prelegal_auth')
    return stored ? (JSON.parse(stored) as AuthState) : null
  } catch {
    return null
  }
}

export default function App() {
  const [auth, setAuth] = useState<AuthState | null>(loadAuth)

  const handleLogin = (token: string, email: string) => {
    const state = { token, email }
    localStorage.setItem('prelegal_auth', JSON.stringify(state))
    setAuth(state)
  }

  const handleLogout = () => {
    localStorage.removeItem('prelegal_auth')
    setAuth(null)
  }

  if (!auth) {
    return <LoginPage onLogin={handleLogin} />
  }

  return <HomePage token={auth.token} userEmail={auth.email} onLogout={handleLogout} />
}
