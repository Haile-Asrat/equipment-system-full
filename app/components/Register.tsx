'use client'

import { useState, useEffect } from 'react'

interface RegisterProps {
  onSuccess: () => void
}

export default function Register({ onSuccess }: RegisterProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [captcha, setCaptcha] = useState({ question: '', answer: 0 })
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [userId, setUserId] = useState<number | null>(null)
  const [otpCode, setOtpCode] = useState('')

  // Generate captcha on mount
  useEffect(() => {
    const num1 = Math.floor(Math.random() * 10) + 1
    const num2 = Math.floor(Math.random() * 10) + 1
    setCaptcha({ question: `${num1} + ${num2}`, answer: num1 + num2 })
  }, [])

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1
    const num2 = Math.floor(Math.random() * 10) + 1
    setCaptcha({ question: `${num1} + ${num2}`, answer: num1 + num2 })
    setCaptchaAnswer('')
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    if (Number(captchaAnswer) !== captcha.answer) {
      setError('Captcha answer is incorrect')
      generateCaptcha()
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          captcha: captcha.answer,
          captchaAnswer: Number(captchaAnswer),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed')
        setLoading(false)
        generateCaptcha()
        return
      }

      // Always show the same success message for security
      setSuccess('Registration successful! Check your email for verification code. Do not refresh until verified.')
      setUserId(data.userId)
      setLoading(false)
    } catch (err) {
      setError('Network error. Please try again.')
      setLoading(false)
      generateCaptcha()
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code: otpCode }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Verification failed')
        setLoading(false)
        return
      }

      setSuccess('Email verified! You can now login.')
      setTimeout(() => {
        onSuccess()
      }, 2000)
    } catch (err) {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  if (userId) {
    return (
      <div>
        {success && <div className="success">{success}</div>}
        {error && <div className="error">{error}</div>}
        <h2 style={{ marginBottom: '16px' }}>Verify Your Email</h2>
        <p style={{ marginBottom: '16px' }}>Enter the verification code sent to your email:</p>
        <form onSubmit={handleVerify}>
          <label htmlFor="otp">Verification Code</label>
          <input
            id="otp"
            type="text"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            required
            maxLength={6}
          />
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <form onSubmit={handleRegister}>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      <label htmlFor="name">Name</label>
      <input
        id="name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        autoComplete="off"
      />
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="off"
      />
      <label htmlFor="password">Password (min 8 characters)</label>
      <div style={{ position: 'relative' }}>
        <input
          id="password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          style={{ paddingRight: '40px' }}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            color: '#666'
          }}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          )}
        </button>
      </div>
      <label htmlFor="captcha">Captcha: {captcha.question} = ?</label>
      <input
        id="captcha"
        type="number"
        value={captchaAnswer}
        onChange={(e) => setCaptchaAnswer(e.target.value)}
        required
      />
      <button type="button" onClick={generateCaptcha} className="btn btn-secondary" style={{ marginBottom: '16px' }}>
        New Captcha
      </button>
      <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  )
}

