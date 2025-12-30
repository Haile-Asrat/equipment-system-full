'use client'

import { useState } from 'react'

import EquipmentForm from './EquipmentForm'

interface EquipmentListProps {
  equipment: any[]
  token: string
  onUpdate: () => void
  user: any
}

export default function EquipmentList({ equipment, token, onUpdate, user }: EquipmentListProps) {
  const [borrowing, setBorrowing] = useState<number | null>(null)
  const [editingItem, setEditingItem] = useState<any | null>(null)

  // Permissions Modal State
  const [showPermissions, setShowPermissions] = useState<number | null>(null)
  const [permissions, setPermissions] = useState<any[]>([])
  const [permLoading, setPermLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [canEdit, setCanEdit] = useState(true)
  const [canDelete, setCanDelete] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleBorrow = async (equipmentId: number) => {
    setBorrowing(equipmentId)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/borrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, equipmentId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to borrow equipment')
        setBorrowing(null)
        return
      }

      setSuccess('Borrow request submitted successfully!')
      setBorrowing(null)
      setTimeout(() => {
        setSuccess('')
        onUpdate()
      }, 2000)
    } catch (err) {
      setError('Network error. Please try again.')
      setBorrowing(null)
    }
  }

  const handleDelete = async (equipmentId: number, equipmentName: string) => {
    if (!confirm(`Are you sure you want to delete "${equipmentName}"? This will also delete all related borrow requests.`)) return

    try {
      const res = await fetch('/api/equipment', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, equipmentId }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to delete equipment')
        return
      }

      setSuccess('Equipment deleted successfully!')
      setTimeout(() => {
        setSuccess('')
        onUpdate()
      }, 1500)
    } catch (err) {
      setError('Network error. Please try again.')
    }
  }

  // Permission Handlers
  const openPermissions = async (equipmentId: number) => {
    setShowPermissions(equipmentId)
    setPermissions([])
    setPermLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/equipment/permissions?equipmentId=${equipmentId}&token=${token}`)
      if (res.ok) {
        setPermissions(await res.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setPermLoading(false)
    }
  }

  const searchUsers = async (q: string) => {
    setSearchQuery(q)
    if (q.length < 2) {
      setSearchResults([])
      return
    }

    try {
      const res = await fetch(`/api/users/search?q=${q}&token=${token}`)
      if (res.ok) {
        setSearchResults(await res.json())
      }
    } catch (e) {
      console.error(e)
    }
  }

  const grantPermission = async () => {
    if (!selectedUser || !showPermissions) return

    try {
      const res = await fetch('/api/equipment/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          equipmentId: showPermissions,
          userId: selectedUser.id,
          canEdit,
          canDelete
        })
      })

      if (res.ok) {
        // Refresh permissions
        openPermissions(showPermissions)
        setSearchQuery('')
        setSearchResults([])
        setSelectedUser(null)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to grant permission')
      }
    } catch (e) {
      alert('Network error')
    }
  }

  const revokePermission = async (userId: number) => {
    if (!showPermissions || !confirm('Revoke access?')) return

    try {
      const res = await fetch('/api/equipment/permissions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          equipmentId: showPermissions,
          userId
        })
      })

      if (res.ok) {
        openPermissions(showPermissions)
      }
    } catch (e) {
      alert('Network error')
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Available Equipment</h2>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {/* Permissions Modal */}
      {showPermissions && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-card" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 className="auth-title" style={{ fontSize: '20px', marginBottom: '16px' }}>Manage Permissions</h3>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '8px' }}>Add User</h4>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Search user by name or email..."
                  value={searchQuery}
                  onChange={e => searchUsers(e.target.value)}
                />
              </div>
              {searchResults.length > 0 && !selectedUser && (
                <ul style={{ border: '1px solid #eee', borderRadius: '4px', maxHeight: '100px', overflowY: 'auto', listStyle: 'none', padding: 0 }}>
                  {searchResults.map(u => (
                    <li
                      key={u.id}
                      onClick={() => { setSelectedUser(u); setSearchResults([]); setSearchQuery(u.email); }}
                      style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                    >
                      {u.name} ({u.email})
                    </li>
                  ))}
                </ul>
              )}

              {selectedUser && (
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginTop: '8px' }}>
                  <p><strong>Selected:</strong> {selectedUser.name}</p>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input type="checkbox" checked={canEdit} onChange={e => setCanEdit(e.target.checked)} /> Can Edit
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input type="checkbox" checked={canDelete} onChange={e => setCanDelete(e.target.checked)} /> Can Delete
                    </label>
                  </div>
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary" onClick={grantPermission}>Grant Access</button>
                    <button className="btn btn-secondary" onClick={() => { setSelectedUser(null); setSearchQuery(''); }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid #eee', paddingTop: '16px' }}>
              <h4 style={{ marginBottom: '12px' }}>Current Access</h4>
              {permLoading ? <p>Loading...</p> : (
                permissions.length === 0 ? <p style={{ color: '#666' }}>No special permissions granted.</p> : (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {permissions.map(p => (
                      <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <div>
                          <div style={{ fontWeight: '600' }}>{p.user.name}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {p.canEdit && 'Edit'} {p.canEdit && p.canDelete && '•'} {p.canDelete && 'Delete'}
                          </div>
                        </div>
                        <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => revokePermission(p.userId)}>Revoke</button>
                      </li>
                    ))}
                  </ul>
                )
              )}
            </div>

            <button className="btn btn-secondary" style={{ width: '100%', marginTop: '20px' }} onClick={() => setShowPermissions(null)}>Close</button>
          </div>
        </div>
      )}

      {editingItem && (
        <div style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
          <EquipmentForm
            token={token}
            initialData={editingItem}
            onSuccess={() => {
              setEditingItem(null)
              onUpdate()
            }}
            onCancel={() => setEditingItem(null)}
          />
        </div>
      )}

      {equipment.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No equipment available
        </p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Quantity</th>
              <th>Sensitivity</th>
              <th>Owner</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {equipment.map((item) => {
              const isOwner = user.id === item.ownerId;
              // Check if user has explicit permission
              const userPerm = item.permissions?.find((p: any) => p.userId === user.id);
              const canEdit = isOwner || userPerm?.canEdit;
              const canDelete = isOwner || userPerm?.canDelete;

              return (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.description || '-'}</td>
                  <td>{item.quantity}</td>
                  <td>
                    <span className={`badge badge-${item.sensitivity.toLowerCase()}`}>
                      {item.sensitivity}
                    </span>
                  </td>
                  <td>{item.owner?.name || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      {canEdit && (
                        <button
                          className="btn"
                          onClick={() => setEditingItem(item)}
                          style={{ padding: '6px 12px', fontSize: '14px', background: '#ffa502', color: 'white' }}
                        >
                          Edit
                        </button>
                      )}

                      {canDelete && (
                        <button
                          className="btn"
                          onClick={() => handleDelete(item.id, item.name)}
                          style={{ padding: '6px 12px', fontSize: '14px', background: '#ff6b6b', color: 'white' }}
                        >
                          Delete
                        </button>
                      )}

                      {isOwner && (
                        <button
                          className="btn"
                          onClick={() => openPermissions(item.id)}
                          style={{ padding: '6px 12px', fontSize: '14px', background: '#667eea', color: 'white' }}
                        >
                          Permissions
                        </button>
                      )}

                      {!isOwner && !canEdit && !canDelete && (
                        <button
                          className="btn btn-primary"
                          onClick={() => handleBorrow(item.id)}
                          disabled={borrowing === item.id}
                          style={{ padding: '6px 12px', fontSize: '14px' }}
                        >
                          {borrowing === item.id ? 'Requesting...' : 'Borrow'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

