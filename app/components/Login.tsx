'use client'

import { useState } from 'react'

interface LoginProps {
  onLogin: (token: string) => void
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Verification state
  const [needsVerification, setNeedsVerification] = useState(false)
  const [userId, setUserId] = useState<number | null>(null)
  const [otpCode, setOtpCode] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'Email not verified') {
          if (data.userId) {
            setUserId(data.userId)
            setNeedsVerification(true)
            setError('Email not verified. Please enter the code sent to your email.')
          } else {
            setError(data.error || 'Login failed')
          }
        } else {
          setError(data.error || 'Login failed')
        }
        setLoading(false)
        return
      }

      onLogin(data.token)
    } catch (err) {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload: any = { code: otpCode }
      if (userId) {
        payload.userId = userId
      } else {
        payload.email = email
      }

      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Verification failed')
        setLoading(false)
        return
      }

      setSuccess('Email verified! Logging in...')

      // Auto-login after verification
      const loginRes = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (loginRes.ok) {
        const loginData = await loginRes.json()
        onLogin(loginData.token)
      } else {
        // Fallback if auto-login fails (e.g. no password entered yet)
        setNeedsVerification(false)
        setLoading(false)
        if (password) {
          setError('Verified, but auto-login failed. Please login manually.')
        } else {
          setSuccess('Verified successfully! Please login.')
        }
      }

    } catch (err) {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  if (needsVerification) {
    return (
      <div className="auth-container">
        <div className="glass-card">
          <form onSubmit={handleVerify}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h3 className="auth-title" style={{ marginBottom: '8px' }}>Verify Account</h3>
              <p className="auth-subtitle">Enter the 6-digit code sent to your email.</p>
            </div>

            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}

            {/* If we don't have a userId yet (manual verification), verify by email */}
            {!userId && (
              <div className="input-group">
                <label htmlFor="verify-email" className="input-label">Email Address</label>
                <input
                  id="verify-email"
                  type="email"
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@company.com"
                />
              </div>
            )}

            <div className="input-group">
              <label htmlFor="otp" className="input-label">Verification Code</label>
              <input
                id="otp"
                type="text"
                className="input-field"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                required
                maxLength={6}
                placeholder="123456"
                style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '20px' }}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-premium" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={async () => {
                  setError('');
                  setSuccess('');
                  if (!email) {
                    setError('Please enter your email first to resend code.');
                    return;
                  }
                  try {
                    const res = await fetch('/api/auth/resend-code', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setSuccess('Code resent! Please check your email.');
                    } else {
                      setError(data.error || 'Failed to resend code.');
                    }
                  } catch (e) {
                    setError('Network error. Could not resend code.');
                  }
                }}
                className="link-btn"
                style={{ display: 'block', width: '100%', marginBottom: '12px' }}
              >
                Resend Verification Code
              </button>

              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setNeedsVerification(false);
                  setError('');
                  setSuccess('');
                }}
                style={{ color: '#718096' }}
              >
                ← Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="glass-card">
        <h3 className="auth-title">Welcome Back</h3>
        <p className="auth-subtitle">Sign in to manage your equipment</p>

        <form onSubmit={handleSubmit}>
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <div className="input-group">
            <label htmlFor="email" className="input-label">Email Address</label>
            <input
              id="email"
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="off"
              placeholder="name@company.com"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password" className="input-label">Password</label>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Enter your password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          </div>

          <button type="submit" className="btn btn-primary btn-premium" disabled={loading}>
            {loading ? 'Logging in...' : 'Sign In'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <button
              type="button"
              onClick={() => {
                setNeedsVerification(true)
                setUserId(null)
              }}
              className="link-btn"
            >
              Have a verification code?
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
