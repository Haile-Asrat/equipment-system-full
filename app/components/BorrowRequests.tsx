'use client'

import { useState, useEffect } from 'react'

interface BorrowRequestsProps {
  token: string
  user: any
  onUpdate: () => void
  pendingOnly?: boolean
}

export default function BorrowRequests({ token, user, onUpdate, pendingOnly }: BorrowRequestsProps) {
  const [requests, setRequests] = useState<any[]>([])
  const [equipment, setEquipment] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [processing, setProcessing] = useState<number | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [reqRes, equipRes] = await Promise.all([
        fetch('/api/borrow?token=' + encodeURIComponent(token)),
        fetch('/api/equipment'),
      ])

      if (reqRes.ok) {
        const reqData = await reqRes.json()
        let filtered = reqData

        if (pendingOnly) {
          filtered = reqData.filter((r: any) => r.status === 'Pending' && r.userId !== user.id)
        } else {
          filtered = reqData.filter((r: any) => r.userId === user.id)
        }

        setRequests(filtered)
      }

      if (equipRes.ok) {
        const equipData = await equipRes.json()
        setEquipment(equipData)
      }
    } catch (err) {
      setError('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId: number) => {
    setProcessing(requestId)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, requestId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to approve request')
        setProcessing(null)
        return
      }

      setSuccess('Request approved successfully!')
      setProcessing(null)
      setTimeout(() => {
        setSuccess('')
        loadData()
        onUpdate()
      }, 2000)
    } catch (err) {
      setError('Network error. Please try again.')
      setProcessing(null)
    }
  }

  const handleReturn = async (requestId: number) => {
    setProcessing(requestId)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, requestId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to return equipment')
        setProcessing(null)
        return
      }

      setSuccess('Equipment returned successfully!')
      setProcessing(null)
      setTimeout(() => {
        setSuccess('')
        loadData()
        onUpdate()
      }, 2000)
    } catch (err) {
      setError('Network error. Please try again.')
      setProcessing(null)
    }
  }

  const getEquipmentName = (equipmentId: number) => {
    const item = equipment.find((e) => e.id === equipmentId)
    return item?.name || `Equipment #${equipmentId}`
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
  }

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>
        {pendingOnly ? 'Pending Approval Requests' : 'My Borrow Requests'}
      </h2>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {requests.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No requests found
        </p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Equipment</th>
              <th>Status</th>
              <th>Requested</th>
              {pendingOnly && <th>Requested By</th>}
              <th>Approved At</th>
              <th>Returned At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id}>
                <td>{getEquipmentName(req.equipmentId)}</td>
                <td>
                  <span className={`badge badge-${req.status.toLowerCase()}`}>
                    {req.status}
                  </span>
                </td>
                <td>{new Date(req.createdAt).toLocaleString()}</td>
                {pendingOnly && <td>User #{req.userId}</td>}
                <td>{req.approvedAt ? new Date(req.approvedAt).toLocaleString() : '-'}</td>
                <td>{req.returnedAt ? new Date(req.returnedAt).toLocaleString() : '-'}</td>
                <td>
                  {pendingOnly && req.status === 'Pending' && (
                    <button
                      className="btn btn-success"
                      onClick={() => handleApprove(req.id)}
                      disabled={processing === req.id}
                      style={{ padding: '6px 12px', fontSize: '14px', marginRight: '8px' }}
                    >
                      {processing === req.id ? 'Processing...' : 'Approve'}
                    </button>
                  )}
                  {!pendingOnly && req.status === 'Approved' && (
                    <button
                      className="btn btn-primary"
                      onClick={() => handleReturn(req.id)}
                      disabled={processing === req.id}
                      style={{ padding: '6px 12px', fontSize: '14px' }}
                    >
                      {processing === req.id ? 'Processing...' : 'Return'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

