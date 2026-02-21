import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { invite, type InviteBody } from '../api/endpoints'
import { layout, card, inputStyle, primaryButton, secondaryButton } from '../styles/common'

type KeyValue = { key: string; value: string }

export default function VisitorEntry() {
  const navigate = useNavigate()
  const [hostEmail, setHostEmail] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestContact, setGuestContact] = useState('')
  const [extraFields, setExtraFields] = useState<KeyValue[]>([{ key: '', value: '' }])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const addField = () => setExtraFields((prev) => [...prev, { key: '', value: '' }])
  const updateField = (i: number, field: 'key' | 'value', val: string) => {
    setExtraFields((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: val }
      return next
    })
  }
  const removeField = (i: number) =>
    setExtraFields((prev) => prev.filter((_, j) => j !== i))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const body: InviteBody = {
      host_email: hostEmail,
      guest_name: guestName,
      guest_contact_number: guestContact,
    }
    extraFields.forEach(({ key, value }) => {
      if (key.trim()) body[key.trim()] = value
    })
    try {
      await invite(body)
      navigate('/emergencies', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invite failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={layout}>
      <div style={card}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Visitor Entry</h1>
        <p style={{ fontSize: '1rem', color: '#9ca3af', marginBottom: '1.5rem' }}>
          Invite a guest. Add optional key-value fields (e.g. WhatsApp contact).
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '0.9rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.9rem', color: '#e5e7eb' }}>Host email</label>
              <input
                type="email"
                required
                placeholder="Your email (host)"
                style={inputStyle}
                value={hostEmail}
                onChange={(e) => setHostEmail(e.target.value)}
              />
            </div>
            <div style={{ display: 'grid', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.9rem', color: '#e5e7eb' }}>Guest name</label>
              <input
                type="text"
                required
                placeholder="Guest full name"
                style={inputStyle}
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
              />
            </div>
            <div style={{ display: 'grid', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.9rem', color: '#e5e7eb' }}>Guest contact number</label>
              <input
                type="tel"
                required
                placeholder="Contact number"
                style={inputStyle}
                value={guestContact}
                onChange={(e) => setGuestContact(e.target.value)}
              />
            </div>
            {extraFields.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Key (e.g. WhatsApp contact)"
                  style={{ ...inputStyle, flex: 1 }}
                  value={f.key}
                  onChange={(e) => updateField(i, 'key', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Value"
                  style={{ ...inputStyle, flex: 1 }}
                  value={f.value}
                  onChange={(e) => updateField(i, 'value', e.target.value)}
                />
                <button type="button" style={secondaryButton} onClick={() => removeField(i)}>
                  Remove
                </button>
              </div>
            ))}
            <button type="button" style={secondaryButton} onClick={addField}>
              Add key-value field
            </button>
          </div>
          {error && <p style={{ color: '#f87171', marginBottom: '1rem' }}>{error}</p>}
          <button type="submit" style={primaryButton} disabled={loading}>
            {loading ? 'Submitting…' : 'Submit invite'}
          </button>
        </form>
        <div style={{ marginTop: '1.5rem' }}>
          <button type="button" style={secondaryButton} onClick={() => navigate('/emergencies')}>
            Go to Emergencies
          </button>
        </div>
      </div>
    </div>
  )
}
