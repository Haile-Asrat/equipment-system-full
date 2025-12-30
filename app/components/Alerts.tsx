'use client'

import { useState, useEffect } from 'react'

interface Alert {
    id: number
    type: string
    severity: string
    message: string
    userId?: number
    ipAddress?: string
    createdAt: string
    user?: {
        name?: string
        email?: string
    }
}

interface AlertsProps {
    token: string
}

export default function Alerts({ token }: AlertsProps) {
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        loadAlerts()
    }, [])

    const loadAlerts = async () => {
        try {
            const res = await fetch('/api/alerts', {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (!res.ok) {
                setError('Failed to load alerts')
                setLoading(false)
                return
            }

            const data = await res.json()
            setAlerts(data)
        } catch (err) {
            setError('Network error')
        } finally {
            setLoading(false)
        }
    }

    const handleResolve = async (alertId: number) => {
        try {
            const res = await fetch('/api/alerts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, alertId })
            })

            if (res.ok) {
                setAlerts(alerts.filter(a => a.id !== alertId))
            }
        } catch (err) {
            console.error('Failed to resolve alert:', err)
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'Critical': return '#d32f2f'
            case 'High': return '#f57c00'
            case 'Medium': return '#fbc02d'
            case 'Low': return '#388e3c'
            default: return '#666'
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'FailedLogin': return '🔐'
            case 'AccountLockout': return '🔒'
            case 'UnauthorizedAccess': return '⚠️'
            case 'SuspiciousActivity': return '👁️'
            default: return '🔔'
        }
    }

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '40px' }}>Loading alerts...</div>
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Security Alerts</h2>
                <span style={{
                    background: alerts.length > 0 ? '#ff6b6b' : '#4CAF50',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 'bold'
                }}>
                    {alerts.length} Active
                </span>
            </div>

            {error && <div className="error">{error}</div>}

            {alerts.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    background: '#f5f5f5',
                    borderRadius: '8px',
                    color: '#666'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                    <h3 style={{ margin: '0 0 8px 0' }}>No Active Alerts</h3>
                    <p style={{ margin: 0 }}>All security alerts have been resolved</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {alerts.map((alert) => (
                        <div
                            key={alert.id}
                            style={{
                                border: `2px solid ${getSeverityColor(alert.severity)}`,
                                borderRadius: '8px',
                                padding: '16px',
                                background: 'white',
                                display: 'flex',
                                gap: '16px',
                                alignItems: 'flex-start'
                            }}
                        >
                            <div style={{ fontSize: '32px' }}>{getTypeIcon(alert.type)}</div>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{
                                        background: getSeverityColor(alert.severity),
                                        color: 'white',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}>
                                        {alert.severity}
                                    </span>
                                    <span style={{ color: '#666', fontSize: '14px' }}>
                                        {alert.type.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                    <span style={{ color: '#999', fontSize: '12px', marginLeft: 'auto' }}>
                                        {new Date(alert.createdAt).toLocaleString()}
                                    </span>
                                </div>

                                <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                                    {alert.message}
                                </p>

                                <div style={{ fontSize: '12px', color: '#666' }}>
                                    {alert.user && (
                                        <span style={{ marginRight: '16px' }}>
                                            👤 {alert.user.name || alert.user.email}
                                        </span>
                                    )}
                                    {alert.ipAddress && (
                                        <span>
                                            🌐 IP: {alert.ipAddress}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => handleResolve(alert.id)}
                                style={{
                                    background: '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Resolve
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
