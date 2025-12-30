'use client'

import { useState, useEffect } from 'react'

interface UserManagementProps {
    token: string
}

export default function UserManagement({ token }: UserManagementProps) {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [editingUser, setEditingUser] = useState<any>(null)

    useEffect(() => {
        loadUsers()
    }, [])

    const loadUsers = async () => {
        try {
            setError(null)
            const res = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (res.ok) {
                const data = await res.json()
                console.log('Loaded users:', data)
                setUsers(data)
            } else {
                const errorData = await res.json()
                console.error('Failed to load users:', res.status, errorData)
                setError(`Failed to load users: ${errorData.error || res.statusText}`)
            }
        } catch (err) {
            console.error('Error loading users:', err)
            setError('Error loading users: ' + (err as Error).message)
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (user: any) => {
        setEditingUser({ ...user })
    }

    const handleSave = async () => {
        if (!editingUser) return

        try {
            const res = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: editingUser.id,
                    role: editingUser.role,
                    clearance: editingUser.clearance,
                    department: editingUser.department,
                }),
            })

            if (res.ok) {
                await loadUsers()
                setEditingUser(null)
            } else {
                alert('Failed to update user')
            }
        } catch (err) {
            console.error('Error updating user:', err)
            alert('Error updating user')
        }
    }

    const handleDelete = async (userId: number) => {
        if (!confirm('Are you sure you want to delete this user?')) return

        console.log('Attempting to delete user:', userId)
        setLoading(true)

        try {
            const res = await fetch('/api/admin/users', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId }),
            })

            console.log('Delete response status:', res.status)

            if (res.ok) {
                console.log('User deleted successfully')
                await loadUsers()
                alert('User deleted successfully')
            } else {
                const error = await res.json()
                console.error('Delete failed:', error)
                alert(error.error || 'Failed to delete user')
            }
        } catch (err) {
            console.error('Error deleting user:', err)
            alert('Error deleting user: ' + (err as Error).message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '40px' }}>Loading users...</div>
    }

    if (error) {
        return (
            <div>
                <h2 style={{ marginBottom: '20px' }}>User Management</h2>
                <div style={{ padding: '20px', background: '#ffebee', borderRadius: '8px', color: '#c62828' }}>
                    <strong>Error:</strong> {error}
                </div>
                <button onClick={loadUsers} className="btn btn-primary" style={{ marginTop: '16px' }}>
                    Retry
                </button>
            </div>
        )
    }

    return (
        <div>
            <h2 style={{ marginBottom: '20px' }}>User Management</h2>

            {(() => {
                console.log('Rendering with users:', users, 'length:', users.length)
                return null
            })()}

            {users.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    No users found in the system.
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                                <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Role</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Department</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Clearance</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Verified</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Failed Logins</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                                    <td style={{ padding: '12px' }}>{user.id}</td>
                                    <td style={{ padding: '12px' }}>{user.name || 'N/A'}</td>
                                    <td style={{ padding: '12px' }}>{user.email || 'N/A'}</td>
                                    <td style={{ padding: '12px' }}>
                                        {editingUser?.id === user.id ? (
                                            <select
                                                value={editingUser.role}
                                                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                                style={{ padding: '4px' }}
                                            >
                                                <option value="employee">Employee</option>
                                                <option value="manager">Manager</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        ) : (
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                background: user.role === 'admin' ? '#ff6b6b' : user.role === 'manager' ? '#4ecdc4' : '#95e1d3',
                                                color: 'white',
                                                fontSize: '12px'
                                            }}>
                                                {user.role}
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {editingUser?.id === user.id ? (
                                            <input
                                                type="text"
                                                value={editingUser.department || ''}
                                                onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                                                style={{ padding: '4px', width: '100px' }}
                                            />
                                        ) : (
                                            user.department || 'N/A'
                                        )}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {editingUser?.id === user.id ? (
                                            <select
                                                value={editingUser.clearance}
                                                onChange={(e) => setEditingUser({ ...editingUser, clearance: e.target.value })}
                                                style={{ padding: '4px' }}
                                            >
                                                <option value="Public">Public</option>
                                                <option value="Confidential">Confidential</option>
                                                <option value="Secret">Secret</option>
                                                <option value="Top Secret">Top Secret</option>
                                            </select>
                                        ) : (
                                            user.clearance
                                        )}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {user.emailVerified ? '✓' : '✗'}
                                    </td>
                                    <td style={{ padding: '12px' }}>{user.failedLogins}</td>
                                    <td style={{ padding: '12px' }}>
                                        {editingUser?.id === user.id ? (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={handleSave}
                                                    className="btn btn-primary"
                                                    style={{ padding: '4px 12px', fontSize: '14px' }}
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingUser(null)}
                                                    className="btn btn-secondary"
                                                    style={{ padding: '4px 12px', fontSize: '14px' }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="btn btn-primary"
                                                    style={{ padding: '4px 12px', fontSize: '14px' }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="btn"
                                                    style={{ padding: '4px 12px', fontSize: '14px', background: '#ff6b6b', color: 'white' }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
