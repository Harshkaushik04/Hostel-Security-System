import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getCamerasList,
  getHostelsList,
  addCamera,
  editCamera,
  deleteCamera,
} from '../api/endpoints'
import { layout, card, primaryButton, secondaryButton, inputStyle, logoCircle } from '../styles/common'
import collegeLogo from '../assets/IIT Ropar.png'

type CameraRow = { cameraName: string; hostelName: string }

export default function ManageCameras() {
  const [cameras, setCameras] = useState<CameraRow[]>([])
  const [hostels, setHostels] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  const [addCameraName, setAddCameraName] = useState('')
  const [addHostelName, setAddHostelName] = useState('')

  const [editingName, setEditingName] = useState<string | null>(null)
  const [editHostelName, setEditHostelName] = useState('')
  const [editNewCameraName, setEditNewCameraName] = useState('')

  const loadData = useCallback(async () => {
    setError('')
    setMsg('')
    setLoading(true)
    try {
      const [camRes, hostelRes] = await Promise.all([
        getCamerasList(),
        getHostelsList({}),
      ])
      if (camRes && typeof camRes === 'object' && 'error' in camRes && (camRes as { error?: string }).error) {
        setError((camRes as { error: string }).error)
        setCameras([])
      } else {
        const list = (camRes as { cameras?: CameraRow[] })?.cameras
        setCameras(Array.isArray(list) ? list : [])
      }
      const hl =
        (hostelRes as { hostelsList?: string[] })?.hostelsList ??
        (Array.isArray(hostelRes) ? (hostelRes as string[]) : [])
      setHostels(Array.isArray(hl) ? hl : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
      setCameras([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const resolveMutationError = (res: unknown): string => {
    if (!res || typeof res !== 'object') return ''
    const r = res as { approved?: boolean; error?: string }
    if (r.approved === false && typeof r.error === 'string') return r.error
    if ((res as { error?: string }).error) return String((res as { error: string }).error)
    return ''
  }

  const handleAdd = async () => {
    setError('')
    setMsg('')
    const cn = addCameraName.trim()
    const hn = addHostelName.trim()
    if (!cn || !hn) {
      setError('Camera name and hostel are required.')
      return
    }
    try {
      const res = await addCamera({ cameraName: cn, hostelName: hn })
      const err = resolveMutationError(res)
      if (err) {
        setError(err)
        return
      }
      setMsg('Camera added.')
      setAddCameraName('')
      setAddHostelName('')
      await loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Add failed')
    }
  }

  const startEdit = (row: CameraRow) => {
    setEditingName(row.cameraName)
    setEditHostelName(row.hostelName)
    setEditNewCameraName('')
    setError('')
    setMsg('')
  }

  const cancelEdit = () => {
    setEditingName(null)
    setEditHostelName('')
    setEditNewCameraName('')
  }

  const handleSaveEdit = async () => {
    if (!editingName) return
    setError('')
    setMsg('')
    const hn = editHostelName.trim()
    if (!hn) {
      setError('Hostel is required.')
      return
    }
    const newName = editNewCameraName.trim()
    try {
      const body: {
        cameraName: string
        hostelName: string
        newCameraName?: string
      } = {
        cameraName: editingName,
        hostelName: hn,
      }
      if (newName && newName !== editingName) {
        body.newCameraName = newName
      }
      const res = await editCamera(body)
      const err = resolveMutationError(res)
      if (err) {
        setError(err)
        return
      }
      setMsg('Camera updated.')
      cancelEdit()
      await loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed')
    }
  }

  const handleDelete = async (cameraName: string) => {
    if (!window.confirm(`Remove camera "${cameraName}" from the database?`)) return
    setError('')
    setMsg('')
    try {
      const res = await deleteCamera({ cameraName })
      const err = resolveMutationError(res)
      if (err) {
        setError(err)
        return
      }
      setMsg('Camera deleted.')
      if (editingName === cameraName) cancelEdit()
      await loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
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
            <Link to="/admin" style={{ ...secondaryButton, textDecoration: 'none' }}>
              ← Back to Admin
            </Link>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>
              Cameras & hostels
            </h1>
            <p style={{ fontSize: '1rem', color: '#9ca3af', marginBottom: '1rem' }}>
              Map each MediaMTX camera path (e.g. <code style={{ color: '#e5e7eb' }}>camera1</code>) to a hostel.
              Hostels must exist first — add them under Manage → hostels.
            </p>
            {loading && <p style={{ color: '#9ca3af' }}>Loading…</p>}
            {error && <p style={{ color: '#f87171', marginBottom: '0.75rem' }}>{error}</p>}
            {msg && <p style={{ color: '#4ade80', marginBottom: '0.75rem' }}>{msg}</p>}

            <section style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Add camera</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  style={{ ...inputStyle, maxWidth: 200 }}
                  placeholder="Camera name"
                  value={addCameraName}
                  onChange={(e) => setAddCameraName(e.target.value)}
                />
                <select
                  style={{ ...inputStyle, maxWidth: 220 }}
                  value={addHostelName}
                  onChange={(e) => setAddHostelName(e.target.value)}
                >
                  <option value="">Select hostel…</option>
                  {hostels.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <button type="button" style={primaryButton} onClick={() => void handleAdd()} disabled={loading}>
                  Add
                </button>
                <button type="button" style={secondaryButton} onClick={() => void loadData()} disabled={loading}>
                  Refresh
                </button>
              </div>
            </section>

            <section>
              <h2 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Assignments</h2>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {cameras.map((row) => (
                  <div
                    key={row.cameraName}
                    style={{
                      padding: '0.75rem',
                      borderRadius: 8,
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    {editingName === row.cameraName ? (
                      <div style={{ display: 'grid', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                          Rename camera (optional)
                          <input
                            type="text"
                            style={{ ...inputStyle, marginTop: '0.25rem', width: '100%', maxWidth: 320 }}
                            placeholder={row.cameraName}
                            value={editNewCameraName}
                            onChange={(e) => setEditNewCameraName(e.target.value)}
                          />
                        </label>
                        <label style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                          Hostel
                          <select
                            style={{ ...inputStyle, marginTop: '0.25rem', width: '100%', maxWidth: 320 }}
                            value={editHostelName}
                            onChange={(e) => setEditHostelName(e.target.value)}
                          >
                            {hostels.map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button type="button" style={primaryButton} onClick={() => void handleSaveEdit()}>
                            Save
                          </button>
                          <button type="button" style={secondaryButton} onClick={cancelEdit}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          gap: '0.75rem',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <strong style={{ color: '#e5e7eb' }}>{row.cameraName}</strong>
                          <span style={{ color: '#9ca3af', marginLeft: '0.5rem' }}>→ {row.hostelName}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button type="button" style={secondaryButton} onClick={() => startEdit(row)}>
                            Edit
                          </button>
                          <button type="button" style={secondaryButton} onClick={() => void handleDelete(row.cameraName)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {!loading && cameras.length === 0 && !error && (
                <p style={{ color: '#9ca3af', marginTop: '0.5rem' }}>No cameras yet. Add one above.</p>
              )}
            </section>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
            <img src={collegeLogo} alt="" style={logoCircle} />
          </div>
        </div>
      </div>
    </div>
  )
}
