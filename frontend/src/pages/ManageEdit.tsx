import { useState } from 'react'
import { Link } from 'react-router-dom'
import { addManually, editUser, deleteUser, uploadCsv } from '../api/endpoints'
import { layout, card, primaryButton, secondaryButton, inputStyle } from '../styles/common'

export default function ManageEdit() {
  const [addData, setAddData] = useState('')
  const [addResult, setAddResult] = useState('')
  const [editData, setEditData] = useState('')
  const [editResult, setEditResult] = useState('')
  const [deleteData, setDeleteData] = useState('')
  const [deleteResult, setDeleteResult] = useState('')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvResult, setCsvResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const resolveBackendError = (res: unknown): string => {
    if (!res || typeof res !== 'object') return ''
    const maybeError = (res as { error?: unknown }).error
    const maybeMessage = (res as { message?: unknown }).message
    const approved = (res as { approved?: unknown }).approved
    if (typeof maybeError === 'string' && maybeError.trim()) return maybeError
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) return maybeMessage
    if (approved === false) return 'Request was rejected by backend'
    return ''
  }

  const handleAddManually = async () => {
    setError('')
    setAddResult('')
    setLoading(true)
    try {
      const body = JSON.parse(addData || '{}')
      const res = await addManually(body)
      const backendError = resolveBackendError(res)
      if (backendError) {
        setError(backendError)
      } else {
        setAddResult(JSON.stringify(res))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON or request failed')
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = async () => {
    setError('')
    setEditResult('')
    setLoading(true)
    try {
      const body = JSON.parse(editData || '{}')
      const res = await editUser(body)
      const backendError = resolveBackendError(res)
      if (backendError) {
        setError(backendError)
      } else {
        setEditResult(JSON.stringify(res))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON or request failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    setError('')
    setDeleteResult('')
    setLoading(true)
    try {
      const body = JSON.parse(deleteData || '{}')
      const res = await deleteUser(body)
      const backendError = resolveBackendError(res)
      if (backendError) {
        setError(backendError)
      } else {
        setDeleteResult(JSON.stringify(res))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON or request failed')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadCsv = async () => {
    if (!csvFile) { setError('Select a file'); return }
    setError('')
    setCsvResult('')
    setLoading(true)
    try {
      const form = new FormData()
      form.append('file', csvFile)
      const res = await uploadCsv(form)
      const backendError = resolveBackendError(res)
      if (backendError) {
        setError(backendError)
      } else {
        setCsvResult(JSON.stringify(res))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={layout}>
      <div style={card}>
        <Link to="/admin/manage" style={{ ...secondaryButton, textDecoration: 'none' }}>← Back to Manage list</Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>
          Manage students / admin — Add, delete, edit
        </h1>
        <p style={{ fontSize: '1rem', color: '#9ca3af', marginBottom: '1.5rem' }}>
          [express] /add-manually, /edit, /delete, /upload-csv
        </p>
        {error && <p style={{ color: '#f87171', marginBottom: '1rem' }}>{error}</p>}
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <section>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Add manually (JSON)</h2>
            <textarea
              style={{ ...inputStyle, minHeight: 120 }}
              placeholder='{"name":"...", ...}'
              value={addData}
              onChange={(e) => setAddData(e.target.value)}
            />
            <button type="button" style={primaryButton} onClick={handleAddManually} disabled={loading}>Add</button>
            {addResult && <pre style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: 8 }}>{addResult}</pre>}
          </section>
          <section>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Edit user (JSON)</h2>
            <textarea
              style={{ ...inputStyle, minHeight: 120 }}
              placeholder='{"email":"...", ...}'
              value={editData}
              onChange={(e) => setEditData(e.target.value)}
            />
            <button type="button" style={primaryButton} onClick={handleEditUser} disabled={loading}>Edit</button>
            {editResult && <pre style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: 8 }}>{editResult}</pre>}
          </section>
          <section>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Delete user (JSON)</h2>
            <textarea
              style={{ ...inputStyle, minHeight: 120 }}
              placeholder='{"email":"..."}'
              value={deleteData}
              onChange={(e) => setDeleteData(e.target.value)}
            />
            <button type="button" style={primaryButton} onClick={handleDeleteUser} disabled={loading}>Delete</button>
            {deleteResult && <pre style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: 8 }}>{deleteResult}</pre>}
          </section>
          <section>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Upload CSV</h2>
            <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)} style={{ color: '#e5e7eb' }} />
            <button type="button" style={primaryButton} onClick={handleUploadCsv} disabled={loading || !csvFile}>Upload CSV</button>
            {csvResult && <pre style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: 8 }}>{csvResult}</pre>}
          </section>
        </div>
      </div>
    </div>
  )
}
