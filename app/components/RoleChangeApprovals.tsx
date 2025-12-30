'use client'

import { useState, useEffect } from 'react'

interface RoleRequest {
    id: number
    userId: number
    currentRole: string
    requestedRole: string
    reason?: string
    status: string
    requestedAt: string
    user: {
        id: number
        name?: string
        email?: string
        department?: string
    }
}

interface RoleChangeApprovalsProps {
    token: string
}

export default function RoleChangeApprovals({ token }: RoleChangeApprovalsProps) {
    const [requests, setRequests] = useState<RoleRequest[]>([])
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [processing, setProcessing] = useState<number | null>(null)

    useEffect(() => {
        loadRequests()
    }, [sortOrder])

    const loadRequests = async () => {
        try {
            const res = await fetch(`/api/admin/role-requests?sortOrder=${sortOrder}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (!res.ok) {
                setError('Failed to load requests')
                setLoading(false)
                return
            }

            const data = await res.json()
            setRequests(data)
        } catch (err) {
            setError('Network error')
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (requestId: number, action: 'approve' | 'reject') => {
        setProcessing(requestId)
        setError('')

        try {
            const res = await fetch('/api/admin/role-requests', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, requestId, action })
            })

            if (!res.ok) {
                const data = await res.json()
                setError(data.error || 'Failed to process request')
                setProcessing(null)
                return
            }

            // Remove from list
            setRequests(requests.filter(r => r.id !== requestId))
            setProcessing(null)
        } catch (err) {
            setError('Network error')
            setProcessing(null)
        }
    }

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '40px' }}>Loading requests...</div>
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Role Change Approvals</h2>
                <span style={{
                    background: requests.length > 0 ? '#ffa500' : '#4CAF50',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 'bold'
                }}>
                    {requests.length} Pending
                </span>
            </div>

            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={() => {
                        const newOrder = sortOrder === 'asc' ? 'desc' : 'asc'
                        setSortOrder(newOrder)
                        // Trigger reload effect or call loadRequests
                        // Note: state update is async, but we can't depend on useEffect dependency here easily without infinite loops if not careful?
                        // Actually, adding sortOrder to useEffect dependency is the clean React way.
                    }}
                    style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                        background: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    <span>Sort: {sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}</span>
                    <span>{sortOrder === 'asc' ? '↓' : '↑'}</span>
                </button>
            </div>

            {error && <div className="error">{error}</div>}

            {requests.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    background: '#f5f5f5',
                    borderRadius: '8px',
                    color: '#666'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                    <h3 style={{ margin: '0 0 8px 0' }}>No Pending Requests</h3>
                    <p style={{ margin: 0 }}>All role change requests have been processed</p>
                </div>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Department</th>
                            <th>Current Role</th>
                            <th>Requested Role</th>
                            <th>Reason</th>
                            <th>Requested Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map((request) => (
                            <tr key={request.id}>
                                <td>{request.user.name || '-'}</td>
                                <td>{request.user.email}</td>
                                <td>{request.user.department || '-'}</td>
                                <td>
                                    <span className="badge" style={{ background: '#666' }}>
                                        {request.currentRole}
                                    </span>
                                </td>
                                <td>
                                    <span className="badge" style={{ background: '#667eea' }}>
                                        {request.requestedRole}
                                    </span>
                                </td>
                                <td style={{ maxWidth: '200px' }}>
                                    {request.reason ? (
                                        <span style={{ fontSize: '13px', fontStyle: 'italic' }}>
                                            "{request.reason}"
                                        </span>
                                    ) : (
                                        <span style={{ color: '#999' }}>No reason provided</span>
                                    )}
                                </td>
                                <td>{new Date(request.requestedAt).toLocaleDateString()}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => handleAction(request.id, 'approve')}
                                            disabled={processing === request.id}
                                            style={{
                                                background: '#4CAF50',
                                                color: 'white',
                                                border: 'none',
                                                padding: '6px 12px',
                                                borderRadius: '4px',
                                                cursor: processing === request.id ? 'not-allowed' : 'pointer',
                                                fontSize: '13px'
                                            }}
                                        >
                                            {processing === request.id ? '...' : 'Approve'}
                                        </button>
                                        <button
                                            onClick={() => handleAction(request.id, 'reject')}
                                            disabled={processing === request.id}
                                            style={{
                                                background: '#ff6b6b',
                                                color: 'white',
                                                border: 'none',
                                                padding: '6px 12px',
                                                borderRadius: '4px',
                                                cursor: processing === request.id ? 'not-allowed' : 'pointer',
                                                fontSize: '13px'
                                            }}
                                        >
                                            {processing === request.id ? '...' : 'Reject'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    )
}
