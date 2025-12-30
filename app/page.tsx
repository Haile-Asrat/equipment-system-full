'use client'

import { useState, useEffect } from 'react'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'

export default function Home() {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [showRegister, setShowRegister] = useState(false)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      setToken(storedToken)
      // Decode token to get user info (simple base64 decode)
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]))
        setUser(payload)
      } catch (e) {
        localStorage.removeItem('token')
      }
    }
  }, [])

  const handleLogin = (newToken: string) => {
    setToken(newToken)
    localStorage.setItem('token', newToken)
    try {
      const payload = JSON.parse(atob(newToken.split('.')[1]))
      setUser(payload)
    } catch (e) {}
  }

  const handleLogout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
  }

  if (token && user) {
    return <Dashboard token={token} user={user} onLogout={handleLogout} />
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '500px', margin: '50px auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '24px', color: '#667eea' }}>
          Equipment Borrowing System
        </h1>
        {showRegister ? (
          <Register onSuccess={() => setShowRegister(false)} />
        ) : (
          <Login onLogin={handleLogin} />
        )}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowRegister(!showRegister)}
            style={{ width: '100%' }}
          >
            {showRegister ? 'Already have an account? Login' : 'Need an account? Register'}
          </button>
        </div>
      </div>
    </div>
  )
}

