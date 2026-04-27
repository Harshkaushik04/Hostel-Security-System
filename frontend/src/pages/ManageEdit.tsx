import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { addManually, editUser, deleteUser, uploadCsv, type AdminPrivilegeApiValue } from '../api/endpoints'
import { layout, card, primaryButton, secondaryButton, inputStyle } from '../styles/common'

export default function ManageEdit() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialType = useMemo(() => {
    const t = (searchParams.get('type') ?? '').toLowerCase()
    return t === 'admin' ? 'admin' : 'student'
  }, [searchParams])
  const [userType, setUserType] = useState<'student' | 'admin'>(initialType)

  const [addName, setAddName] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [addPassword, setAddPassword] = useState('')
  const [addEntryNumber, setAddEntryNumber] = useState('')
  const [addHostelName, setAddHostelName] = useState('')
  const [addPrivilege, setAddPrivilege] = useState<AdminPrivilegeApiValue>('gaurd')
  const [addAllocatedHostel, setAddAllocatedHostel] = useState('')
  const [addResult, setAddResult] = useState('')
  const [editResult, setEditResult] = useState('')
  const [deleteResult, setDeleteResult] = useState('')
  const [editFilterBy, setEditFilterBy] = useState<'email' | 'entry_number'>('email')
  const [editFilterValue, setEditFilterValue] = useState('')
  const [editTarget, setEditTarget] = useState<{ filterBy: 'email' | 'entry_number'; value: string } | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editEntryNumber, setEditEntryNumber] = useState('')
  const [editHostelName, setEditHostelName] = useState('')
  const [editPrivilege, setEditPrivilege] = useState<AdminPrivilegeApiValue>('gaurd')
  const [editAllocatedHostel, setEditAllocatedHostel] = useState('')
  const [deleteFilterBy, setDeleteFilterBy] = useState<'email' | 'entry_number'>('email')
  const [deleteFilterValue, setDeleteFilterValue] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ filterBy: 'email' | 'entry_number'; value: string } | null>(null)
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
      const body =
        userType === 'student'
          ? ({
              type: 'student',
              name: addName.trim(),
              email: addEmail.trim(),
              password: addPassword,
              entry_number: addEntryNumber.trim(),
              hostel_name: addHostelName.trim(),
            } as const)
          : ({
              type: 'admin',
              name: addName.trim(),
              email: addEmail.trim(),
              password: addPassword,
              privelege: addPrivilege,
              allocatedHostel: addAllocatedHostel.trim(),
            } as const)

      if (userType === 'student') {
        if (!body.name || !body.email || !body.password || !body.entry_number || !body.hostel_name) {
          setError('Fill all add-student fields before submitting.')
          return
        }
      } else {
        if (!body.name || !body.email || !body.password || !body.privelege || !body.allocatedHostel) {
          setError('Fill all add-admin fields before submitting.')
          return
        }
      }

      const res = await addManually(body)
      const backendError = resolveBackendError(res)
      if (backendError) {
        setError(backendError)
      } else {
        setAddResult(JSON.stringify(res))
        setAddName('')
        setAddEmail('')
        setAddPassword('')
        setAddEntryNumber('')
        setAddHostelName('')
        setAddPrivilege('gaurd')
        setAddAllocatedHostel('')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = async () => {
    setError('')
    setEditResult('')
    if (!editTarget) {
      setError('First choose a filter and click "Filter" in Edit section.')
      return
    }
    setLoading(true)
    try {
      const body =
        userType === 'student'
          ? ({
              type: 'student',
              filterBy: editTarget.filterBy,
              value: editTarget.value,
              changed: {
                name: editName.trim(),
                email: editEmail.trim(),
                password: editPassword,
                entry_number: editEntryNumber.trim(),
                hostel_name: editHostelName.trim(),
              },
            } as const)
          : ({
              type: 'admin',
              filterBy: 'email',
              value: editTarget.value,
              changed: {
                name: editName.trim(),
                email: editEmail.trim(),
                password: editPassword,
                privelege: editPrivilege,
                allocatedHostel: editAllocatedHostel.trim(),
              },
            } as const)

      if (!body.changed.name || !body.changed.email || !body.changed.password) {
        setError('Fill all edit fields before submitting.')
        return
      }
      if (userType === 'student') {
        if (!body.changed.entry_number || !body.changed.hostel_name) {
          setError('Fill all edit-student fields before submitting.')
          return
        }
      } else {
        if (!body.changed.privelege || !body.changed.allocatedHostel) {
          setError('Fill all edit-admin fields before submitting.')
          return
        }
      }

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
    if (!deleteTarget) {
      setError('First choose a filter and click "Filter" in Delete section.')
      return
    }
    setLoading(true)
    try {
      const body =
        userType === 'student'
          ? ({
              type: 'student',
              filterBy: deleteTarget.filterBy,
              value: deleteTarget.value,
            } as const)
          : ({
              type: 'admin',
              filterBy: 'email',
              value: deleteTarget.value,
            } as const)
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

  const applyEditFilter = () => {
    setError('')
    setEditResult('')
    const value = editFilterValue.trim()
    if (!value) {
      setError('Enter email or entry number for Edit filter.')
      return
    }
    setEditTarget({ filterBy: userType === 'admin' ? 'email' : editFilterBy, value })
  }

  const applyDeleteFilter = () => {
    setError('')
    setDeleteResult('')
    const value = deleteFilterValue.trim()
    if (!value) {
      setError('Enter email or entry number for Delete filter.')
      return
    }
    setDeleteTarget({ filterBy: userType === 'admin' ? 'email' : deleteFilterBy, value })
  }

  const onChangeUserType = (next: 'student' | 'admin') => {
    setUserType(next)
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev)
      p.set('type', next)
      return p
    })
    setError('')
    setAddResult('')
    setEditResult('')
    setDeleteResult('')
    setEditTarget(null)
    setDeleteTarget(null)
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
          [express] /upload-manually, /edit, /delete, /upload-csv
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <button type="button" style={userType === 'student' ? primaryButton : secondaryButton} onClick={() => onChangeUserType('student')}>
            Student
          </button>
          <button type="button" style={userType === 'admin' ? primaryButton : secondaryButton} onClick={() => onChangeUserType('admin')}>
            Admin
          </button>
        </div>
        {error && <p style={{ color: '#f87171', marginBottom: '1rem' }}>{error}</p>}
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <section>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Add {userType === 'admin' ? 'admin' : 'student'}</h2>
            <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input type="text" style={inputStyle} placeholder="Name" value={addName} onChange={(e) => setAddName(e.target.value)} />
              <input type="email" style={inputStyle} placeholder="Email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} />
              <input type="text" style={inputStyle} placeholder="Password" value={addPassword} onChange={(e) => setAddPassword(e.target.value)} />
              {userType === 'student' ? (
                <>
                  <input type="text" style={inputStyle} placeholder="Entry number" value={addEntryNumber} onChange={(e) => setAddEntryNumber(e.target.value)} />
                  <input type="text" style={inputStyle} placeholder="Hostel name" value={addHostelName} onChange={(e) => setAddHostelName(e.target.value)} />
                </>
              ) : (
                <>
                  <select value={addPrivilege} onChange={(e) => setAddPrivilege(e.target.value as AdminPrivilegeApiValue)} style={inputStyle}>
                    <option value="gaurd">Guard</option>
                    <option value="top_privelege">Top privilege</option>
                    <option value="super_user">Super user</option>
                  </select>
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder="Allocated hostel"
                    value={addAllocatedHostel}
                    onChange={(e) => setAddAllocatedHostel(e.target.value)}
                  />
                </>
              )}
            </div>
            <button type="button" style={primaryButton} onClick={handleAddManually} disabled={loading}>Add</button>
            {addResult && <pre style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: 8 }}>{addResult}</pre>}
          </section>
          <section>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Edit {userType === 'admin' ? 'admin' : 'student'}</h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.75rem' }}>
              {userType === 'student' ? (
                <select
                  value={editFilterBy}
                  onChange={(e) => setEditFilterBy(e.target.value as 'email' | 'entry_number')}
                  style={{ ...inputStyle, maxWidth: 170 }}
                >
                  <option value="email">Filter by email</option>
                  <option value="entry_number">Filter by entry number</option>
                </select>
              ) : (
                <span style={{ color: '#e5e7eb', fontSize: '0.9rem' }}>Filter by email</span>
              )}
              <input
                type="text"
                style={{ ...inputStyle, maxWidth: 280 }}
                placeholder={userType === 'admin' || editFilterBy === 'email' ? 'email@example.com' : 'Entry number'}
                value={editFilterValue}
                onChange={(e) => setEditFilterValue(e.target.value)}
              />
              <button type="button" style={secondaryButton} onClick={applyEditFilter} disabled={loading}>Filter</button>
            </div>
            {editTarget && (
              <p style={{ color: '#9ca3af', marginBottom: '0.75rem' }}>
                Selected {userType === 'admin' ? 'admin' : 'student'}: {editTarget.filterBy} = {editTarget.value}
              </p>
            )}
            <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input type="text" style={inputStyle} placeholder="New name" value={editName} onChange={(e) => setEditName(e.target.value)} />
              <input type="email" style={inputStyle} placeholder="New email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              <input type="text" style={inputStyle} placeholder="New password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} />
              {userType === 'student' ? (
                <>
                  <input type="text" style={inputStyle} placeholder="New entry number" value={editEntryNumber} onChange={(e) => setEditEntryNumber(e.target.value)} />
                  <input type="text" style={inputStyle} placeholder="New hostel name" value={editHostelName} onChange={(e) => setEditHostelName(e.target.value)} />
                </>
              ) : (
                <>
                  <select value={editPrivilege} onChange={(e) => setEditPrivilege(e.target.value as AdminPrivilegeApiValue)} style={inputStyle}>
                    <option value="gaurd">Guard</option>
                    <option value="top_privelege">Top privilege</option>
                    <option value="super_user">Super user</option>
                  </select>
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder="Allocated hostel"
                    value={editAllocatedHostel}
                    onChange={(e) => setEditAllocatedHostel(e.target.value)}
                  />
                </>
              )}
            </div>
            <button type="button" style={primaryButton} onClick={handleEditUser} disabled={loading}>Edit</button>
            {editResult && <pre style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: 8 }}>{editResult}</pre>}
          </section>
          <section>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Delete {userType === 'admin' ? 'admin' : 'student'}</h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.75rem' }}>
              {userType === 'student' ? (
                <select
                  value={deleteFilterBy}
                  onChange={(e) => setDeleteFilterBy(e.target.value as 'email' | 'entry_number')}
                  style={{ ...inputStyle, maxWidth: 170 }}
                >
                  <option value="email">Filter by email</option>
                  <option value="entry_number">Filter by entry number</option>
                </select>
              ) : (
                <span style={{ color: '#e5e7eb', fontSize: '0.9rem' }}>Filter by email</span>
              )}
              <input
                type="text"
                style={{ ...inputStyle, maxWidth: 280 }}
                placeholder={userType === 'admin' || deleteFilterBy === 'email' ? 'email@example.com' : 'Entry number'}
                value={deleteFilterValue}
                onChange={(e) => setDeleteFilterValue(e.target.value)}
              />
              <button type="button" style={secondaryButton} onClick={applyDeleteFilter} disabled={loading}>Filter</button>
            </div>
            {deleteTarget && (
              <p style={{ color: '#9ca3af', marginBottom: '0.75rem' }}>
                Selected {userType === 'admin' ? 'admin' : 'student'}: {deleteTarget.filterBy} = {deleteTarget.value}
              </p>
            )}
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
