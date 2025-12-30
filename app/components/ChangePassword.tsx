'use client'

import { useState } from 'react'

interface ChangePasswordProps {
    token: string
    onClose: () => void
}

export default function ChangePassword({ token, onClose }: ChangePasswordProps) {
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match')
            return
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }

        setLoading(true)

        try {
            const res = await fetch('/api/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, currentPassword, newPassword }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Failed to change password')
                setLoading(false)
                return
            }

            setSuccess('Password changed successfully!')
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
            setTimeout(() => {
                onClose()
            }, 2000)
        } catch (err) {
            setError('Network error. Please try again.')
            setLoading(false)
        }
    }

    const getPasswordStrength = (password: string) => {
        if (password.length === 0) return { strength: '', color: '' }
        if (password.length < 8) return { strength: 'Too short', color: '#ff6b6b' }

        let score = 0
        if (password.length >= 12) score++
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
        if (/\d/.test(password)) score++
        if (/[^a-zA-Z\d]/.test(password)) score++

        if (score === 0) return { strength: 'Weak', color: '#ff6b6b' }
        if (score <= 2) return { strength: 'Fair', color: '#ffa500' }
        if (score === 3) return { strength: 'Good', color: '#4CAF50' }
        return { strength: 'Strong', color: '#2196F3' }
    }

    const passwordStrength = getPasswordStrength(newPassword)

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div className="card" style={{ maxWidth: '500px', width: '90%', margin: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0 }}>Change Password</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
                </div>

                {error && <div className="error">{error}</div>}
                {success && <div className="success">{success}</div>}

                <form onSubmit={handleSubmit}>
                    <label htmlFor="currentPassword">Current Password</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            id="currentPassword"
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            style={{ paddingRight: '40px' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            style={{
                                position: 'absolute',
                                right: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                color: '#666'
                            }}
                        >
                            {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                    </div>

                    <label htmlFor="newPassword">New Password</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            id="newPassword"
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={8}
                            autoComplete="new-password"
                            style={{ paddingRight: '40px' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            style={{
                                position: 'absolute',
                                right: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                color: '#666'
                            }}
                        >
                            {showNewPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                    </div>
                    {newPassword && (
                        <div style={{ fontSize: '12px', marginTop: '4px', color: passwordStrength.color }}>
                            Password strength: {passwordStrength.strength}
                        </div>
                    )}

                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={8}
                            autoComplete="new-password"
                            style={{ paddingRight: '40px' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={{
                                position: 'absolute',
                                right: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                color: '#666'
                            }}
                        >
                            {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
                            {loading ? 'Changing...' : 'Change Password'}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
