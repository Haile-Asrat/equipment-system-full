'use client'

import { useState, useEffect } from 'react'

interface LogsViewProps {
  token: string
}

export default function LogsView({ token }: LogsViewProps) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    try {
      const res = await fetch('/api/logs', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        setError('Failed to load logs')
        setLoading(false)
        return
      }

      const data = await res.json()
      setLogs(data)
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading logs...</div>
  }

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>System Logs</h2>
      {error && <div className="error">{error}</div>}

      {logs.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No logs found
        </p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Action</th>
              <th>User ID</th>
              <th>IP Address</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.id}</td>
                <td>{log.action}</td>
                <td>{log.userId || '-'}</td>
                <td>
                  {log.ipAddress ? (
                    <code style={{
                      background: '#f5f5f5',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontSize: '12px'
                    }}>
                      {log.ipAddress}
                    </code>
                  ) : (
                    <span style={{ color: '#999' }}>-</span>
                  )}
                </td>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
