import { useState } from 'react'
import { LoginPage } from './pages/LoginPage'
import { HomePage } from './pages/HomePage'

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />
  }

  return <HomePage onLogout={() => setIsLoggedIn(false)} />
}
