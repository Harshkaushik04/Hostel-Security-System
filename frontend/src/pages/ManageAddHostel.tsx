import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { addHostel, deleteHostel, editHostel, getHostelsList } from '../api/endpoints'
import collegeLogo from '../assets/IIT Ropar.png'
import { layout, card, primaryButton, secondaryButton, inputStyle, logoCircle } from '../styles/common'

export default function ManageAddHostel() {
  const [hostelName, setHostelName] = useState('')
  const [hostels, setHostels] = useState<string[]>([])
  const [editDraft, setEditDraft] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadHostels = async () => {
    setListLoading(true)
    try {
      const res = (await getHostelsList({})) as { hostelsList?: string[] }
      setHostels(Array.isArray(res?.hostelsList) ? res.hostelsList : [])
    } catch {
      setHostels([])
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => {
    loadHostels()
  }, [])

  const handleAddHostel = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    const trimmed = hostelName.trim()
    if (!trimmed) {
      setError('Hostel name is required.')
      return
    }
    setLoading(true)
    try {
      const res = (await addHostel({ hostel_name: trimmed })) as { approved?: boolean; error?: string }
      if (!res?.approved) {
        setError(res?.error ?? 'Failed to add hostel')
      } else {
        setSuccess(`Hostel "${trimmed}" added successfully.`)
        setHostelName('')
        loadHostels()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add hostel')
    } finally {
      setLoading(false)
    }
  }

  const handleEditHostel = async (oldName: string) => {
    const newName = (editDraft[oldName] ?? '').trim()
    if (!newName) {
      setError('Enter new hostel name before editing.')
      return
    }
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const res = (await editHostel({
        hostel_name: oldName,
        new_hostel_name: newName,
      })) as { approved?: boolean; error?: string }
      if (!res?.approved) {
        setError(res?.error ?? 'Failed to edit hostel')
      } else {
        setSuccess(`Hostel "${oldName}" renamed to "${newName}".`)
        setEditDraft((prev) => {
          const next = { ...prev }
          delete next[oldName]
          return next
        })
        loadHostels()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to edit hostel')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteHostel = async (name: string) => {
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const res = (await deleteHostel({ hostel_name: name })) as { approved?: boolean; error?: string }
      if (!res?.approved) {
        setError(res?.error ?? 'Failed to delete hostel')
      } else {
        setSuccess(`Hostel "${name}" deleted.`)
        loadHostels()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete hostel')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={layout}>
      <div style={card}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 0.7fr)',
            columnGap: '3rem',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <Link to="/admin/manage" style={{ ...secondaryButton, textDecoration: 'none' }}>← Back</Link>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>Add Hostel</h1>
            <p style={{ color: '#9ca3af', marginBottom: '1.2rem' }}>Create a new hostel entry.</p>

            <form onSubmit={handleAddHostel} style={{ display: 'grid', gap: '0.8rem', maxWidth: 420 }}>
              <input
                type="text"
                value={hostelName}
                onChange={(e) => setHostelName(e.target.value)}
                placeholder="Hostel name"
                style={inputStyle}
                required
              />
              {error && <p style={{ color: '#f87171', margin: 0 }}>{error}</p>}
              {success && <p style={{ color: '#4ade80', margin: 0 }}>{success}</p>}
              <button type="submit" style={primaryButton} disabled={loading}>
                {loading ? 'Adding…' : 'Add hostel'}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '0.6rem' }}>Already added hostels</h2>
              {listLoading ? (
                <p style={{ color: '#9ca3af' }}>Loading…</p>
              ) : hostels.length === 0 ? (
                <p style={{ color: '#9ca3af' }}>No hostels found.</p>
              ) : (
                <div style={{ display: 'grid', gap: '0.6rem', maxWidth: 640 }}>
                  {hostels.map((h) => (
                    <div key={h} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) minmax(160px, 1fr) auto auto', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ ...secondaryButton, textAlign: 'center' }}>{h}</span>
                      <input
                        type="text"
                        style={inputStyle}
                        placeholder="New name"
                        value={editDraft[h] ?? ''}
                        onChange={(e) => setEditDraft((prev) => ({ ...prev, [h]: e.target.value }))}
                      />
                      <button type="button" style={primaryButton} disabled={loading} onClick={() => handleEditHostel(h)}>
                        Edit
                      </button>
                      <button type="button" style={secondaryButton} disabled={loading} onClick={() => handleDeleteHostel(h)}>
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
            <img src={collegeLogo} alt="College logo" style={logoCircle} />
          </div>
        </div>
      </div>
    </div>
  )
}
