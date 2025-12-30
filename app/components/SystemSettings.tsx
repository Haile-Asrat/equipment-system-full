'use client'

import { useState, useEffect } from 'react'

interface SystemSettingsProps {
    token: string
}

export default function SystemSettings({ token }: SystemSettingsProps) {
    const [startHour, setStartHour] = useState(8)
    const [endHour, setEndHour] = useState(18)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        loadConfig()
    }, [])

    const loadConfig = async () => {
        try {
            const res = await fetch('/api/admin/config', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setStartHour(data.approvalStartHour)
                setEndHour(data.approvalEndHour)
            }
        } catch (err) {
            console.error('Failed to load config:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setSaving(true)

        if (startHour >= endHour) {
            setError('Start hour must be before end hour')
            setSaving(false)
            return
        }

        try {
            const res = await fetch('/api/admin/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    token,
                    approvalStartHour: startHour,
                    approvalEndHour: endHour
                })
            })

            if (!res.ok) {
                const data = await res.json()
                setError(data.error || 'Failed to save settings')
            } else {
                setSuccess('Settings saved successfully')
                setTimeout(() => setSuccess(''), 3000)
            }
        } catch (err) {
            setError('Network error')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div>Loading settings...</div>

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '20px' }}>System Configuration</h2>

            <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ marginTop: 0 }}>Approval Time Window</h3>
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
                    Set the daily time window during which Managers can approve requests.
                    Admins are always allowed to approve requests at any time.
                </p>

                {error && <div className="error" style={{ marginBottom: '16px' }}>{error}</div>}
                {success && <div className="success" style={{ marginBottom: '16px' }}>{success}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                            <label htmlFor="startHour">Start Hout (24h)</label>
                            <input
                                type="number"
                                id="startHour"
                                min="0"
                                max="23"
                                value={startHour}
                                onChange={(e) => setStartHour(parseInt(e.target.value))}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="endHour">End Hour (24h)</label>
                            <input
                                type="number"
                                id="endHour"
                                min="0"
                                max="23"
                                value={endHour}
                                onChange={(e) => setEndHour(parseInt(e.target.value))}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={saving}
                        style={{ width: '100%' }}
                    >
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </form>

                <div style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                    <h3 style={{ marginTop: 0 }}>Data Backup</h3>
                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
                        Download a full JSON backup of the system data.
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            // Trigger download
                            fetch('/api/admin/backup', {
                                headers: { 'Authorization': `Bearer ${token}` }
                            })
                                .then(res => res.blob())
                                .then(blob => {
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `backup_${Date.now()}.json`;
                                    document.body.appendChild(a);
                                    a.click();
                                    a.remove();
                                })
                                .catch(err => alert('Failed to download backup'));
                        }}
                        className="btn"
                        style={{ background: '#28a745', color: 'white' }}
                    >
                        Download Data Backup
                    </button>
                </div>
            </div>
        </div>
    )
}
