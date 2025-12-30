'use client'

import { useState, useEffect } from 'react'

interface RoleRequest {
    id: number
    currentRole: string
    requestedRole: string
    reason?: string
    status: string
    requestedAt: string
    reviewedAt?: string
}

interface RoleChangeRequestProps {
    token: string
    currentRole: string
}

export default function RoleChangeRequest({ token, currentRole }: RoleChangeRequestProps) {
    const [requestedRole, setRequestedRole] = useState('')
    const [reason, setReason] = useState('')
    const [myRequests, setMyRequests] = useState<RoleRequest[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        loadMyRequests()
    }, [])

    const loadMyRequests = async () => {
        try {
            const res = await fetch('/api/role-change-request', {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (res.ok) {
                const data = await res.json()
                setMyRequests(data)
            }
        } catch (err) {
            console.error('Failed to load requests:', err)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (!requestedRole) {
            setError('Please select a role')
            return
        }

        setLoading(true)

        try {
            const res = await fetch('/api/role-change-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, requestedRole, reason })
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Failed to submit request')
                setLoading(false)
                return
            }

            setSuccess('Role change request submitted successfully!')
            setRequestedRole('')
            setReason('')
            loadMyRequests()
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            setError('Network error. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': return '#ffa500'
            case 'Approved': return '#4CAF50'
            case 'Rejected': return '#ff6b6b'
            default: return '#666'
        }
    }

    const hasPendingRequest = myRequests.some(r => r.status === 'Pending')

    return (
        <div>
            <h2 style={{ marginBottom: '20px' }}>Request Role Change</h2>

            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                <div className="card" style={{ padding: '20px' }}>
                    <h3 style={{ marginTop: 0 }}>Submit New Request</h3>

                    {hasPendingRequest && (
                        <div style={{
                            background: '#fff3cd',
                            border: '1px solid #ffc107',
                            padding: '12px',
                            borderRadius: '4px',
                            marginBottom: '16px',
                            fontSize: '14px'
                        }}>
                            ⚠️ You already have a pending request. Please wait for admin review.
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <label>Current Role</label>
                        <input
                            type="text"
                            value={currentRole}
                            disabled
                            style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
                        />

                        <label htmlFor="requestedRole">Requested Role *</label>
                        <select
                            id="requestedRole"
                            value={requestedRole}
                            onChange={(e) => setRequestedRole(e.target.value)}
                            required
                            disabled={hasPendingRequest}
                        >
                            <option value="">Select a role...</option>
                            {currentRole !== 'employee' && <option value="employee">Employee</option>}
                            {currentRole !== 'manager' && <option value="manager">Manager</option>}
                            {currentRole !== 'admin' && <option value="admin">Admin</option>}
                        </select>

                        <label htmlFor="reason">Reason (Optional)</label>
                        <textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Explain why you need this role change..."
                            rows={4}
                            disabled={hasPendingRequest}
                            style={{ resize: 'vertical' }}
                        />

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || hasPendingRequest}
                            style={{ width: '100%' }}
                        >
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </form>
                </div>

                <div className="card" style={{ padding: '20px' }}>
                    <h3 style={{ marginTop: 0 }}>My Requests</h3>

                    {myRequests.length === 0 ? (
                        <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                            No requests yet
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {myRequests.map((request) => (
                                <div
                                    key={request.id}
                                    style={{
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '6px',
                                        padding: '12px',
                                        background: '#fafafa'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontWeight: 'bold' }}>
                                            {request.currentRole} → {request.requestedRole}
                                        </span>
                                        <span style={{
                                            background: getStatusColor(request.status),
                                            color: 'white',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            fontWeight: 'bold'
                                        }}>
                                            {request.status}
                                        </span>
                                    </div>

                                    {request.reason && (
                                        <p style={{
                                            margin: '8px 0',
                                            fontSize: '13px',
                                            color: '#666',
                                            fontStyle: 'italic'
                                        }}>
                                            "{request.reason}"
                                        </p>
                                    )}

                                    <div style={{ fontSize: '12px', color: '#999' }}>
                                        Requested: {new Date(request.requestedAt).toLocaleDateString()}
                                        {request.reviewedAt && (
                                            <> • Reviewed: {new Date(request.reviewedAt).toLocaleDateString()}</>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
