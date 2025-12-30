'use client'

import { useState } from 'react'

interface EquipmentFormProps {
  token: string
  onSuccess: () => void
  initialData?: any
  onCancel?: () => void
}

export default function EquipmentForm({ token, onSuccess, initialData, onCancel }: EquipmentFormProps) {
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [quantity, setQuantity] = useState(initialData?.quantity?.toString() || '1')
  const [sensitivity, setSensitivity] = useState(initialData?.sensitivity || 'Public')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const isEdit = !!initialData
      const res = await fetch('/api/equipment', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          id: initialData?.id,
          name,
          description,
          quantity: Number(quantity),
          sensitivity,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || `Failed to ${isEdit ? 'update' : 'create'} equipment`)
        setLoading(false)
        return
      }

      setSuccess(`Equipment ${isEdit ? 'updated' : 'created'} successfully!`)
      if (!isEdit) {
        setName('')
        setDescription('')
        setQuantity('1')
        setSensitivity('Public')
      }
      setLoading(false)
      setTimeout(() => {
        onSuccess()
      }, 1000)
    } catch (err) {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>{initialData ? 'Edit Equipment' : 'Add New Equipment'}</h2>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <label htmlFor="name">Equipment Name *</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <label htmlFor="quantity">Quantity *</label>
        <input
          id="quantity"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
          min="1"
        />

        <label htmlFor="sensitivity">Sensitivity Level *</label>
        <select
          id="sensitivity"
          value={sensitivity}
          onChange={(e) => setSensitivity(e.target.value)}
          required
        >
          <option value="Public">Public</option>
          <option value="Confidential">Confidential</option>
          <option value="Secret">Secret</option>
          <option value="Top Secret">Top Secret</option>
        </select>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
            {loading ? 'Processing...' : (initialData ? 'Update Equipment' : 'Create Equipment')}
          </button>
          {onCancel && (
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

