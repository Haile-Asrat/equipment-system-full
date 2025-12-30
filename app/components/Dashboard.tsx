'use client'

import { useState, useEffect } from 'react'
import EquipmentList from './EquipmentList'
import BorrowRequests from './BorrowRequests'
import EquipmentForm from './EquipmentForm'
import LogsView from './LogsView'
import UserManagement from './UserManagement'
import ChangePassword from './ChangePassword'
import Alerts from './Alerts'
import RoleChangeRequest from './RoleChangeRequest'
import RoleChangeApprovals from './RoleChangeApprovals'
import SystemSettings from './SystemSettings'

interface DashboardProps {
  token: string
  user: any
  onLogout: () => void
}

export default function Dashboard({ token, user, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('equipment')
  const [equipment, setEquipment] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showChangePassword, setShowChangePassword] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [equipRes, reqRes] = await Promise.all([
        fetch('/api/equipment'),
        fetch('/api/borrow?token=' + encodeURIComponent(token)),
      ])

      if (equipRes.ok) {
        const equipData = await equipRes.json()
        setEquipment(equipData)
      }

      // Load requests if user is manager/admin
      if ((user.role === 'manager' || user.role === 'admin') && reqRes.ok) {
        const reqData = await reqRes.json()
        setRequests(reqData)
      }
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'equipment', label: 'Equipment' },
    { id: 'requests', label: 'My Requests', show: true },
  ]

  // Non-admin users can request role changes
  if (user.role !== 'admin') {
    tabs.push({ id: 'role-request', label: 'Request Role Change' })
  }

  if (user.role === 'manager' || user.role === 'admin') {
    tabs.push({ id: 'pending', label: 'Pending Approvals' })
  }

  if (user.role === 'admin' || user.role === 'manager') {
    tabs.push({ id: 'add-equipment', label: 'Add Equipment' })
  }

  if (user.role === 'admin') {
    tabs.push({ id: 'users', label: 'User Management' })
    tabs.push({ id: 'role-approvals', label: 'Role Change Approvals' })
    tabs.push({ id: 'alerts', label: 'Alerts' })
    tabs.push({ id: 'logs', label: 'Logs' })
    tabs.push({ id: 'settings', label: 'Settings' })
  }

  return (
    <div className="container">
      <div className="navbar">
        <h1>Equipment Borrowing System</h1>
        <div className="navbar-actions">
          <span style={{ marginRight: '16px', color: '#666' }}>
            {user.email} ({user.role})
          </span>
          <button
            className="btn"
            onClick={() => setShowChangePassword(true)}
            style={{ marginRight: '8px', background: '#667eea', color: 'white' }}
          >
            Change Password
          </button>
          <button className="btn btn-secondary" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e0e0e0', marginBottom: '20px' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="btn"
              style={{
                background: activeTab === tab.id ? '#667eea' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#667eea',
                border: 'none',
                borderRadius: '6px 6px 0 0',
                marginBottom: '-2px',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : (
          <>
            {activeTab === 'equipment' && (
              <EquipmentList equipment={equipment} token={token} onUpdate={loadData} user={user} />
            )}
            {activeTab === 'requests' && (
              <BorrowRequests token={token} user={user} onUpdate={loadData} />
            )}
            {activeTab === 'pending' && (
              <BorrowRequests token={token} user={user} onUpdate={loadData} pendingOnly />
            )}
            {activeTab === 'add-equipment' && (
              <EquipmentForm token={token} onSuccess={loadData} />
            )}
            {activeTab === 'users' && <UserManagement token={token} />}
            {activeTab === 'role-request' && (
              <RoleChangeRequest token={token} currentRole={user.role} />
            )}
            {activeTab === 'role-approvals' && <RoleChangeApprovals token={token} />}
            {activeTab === 'alerts' && <Alerts token={token} />}
            {activeTab === 'logs' && <LogsView token={token} />}
            {activeTab === 'settings' && <SystemSettings token={token} />}
          </>
        )}
      </div>

      {showChangePassword && (
        <ChangePassword
          token={token}
          onClose={() => setShowChangePassword(false)}
        />
      )}
    </div>
  )
}

