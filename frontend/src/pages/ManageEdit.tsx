import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { addManually, editUser, deleteUser, uploadStudentCsv, uploadAdminCsv, getHostelsList, getHostelList, getAdminList, type AdminPrivilegeApiValue } from '../api/endpoints'
import collegeLogo from '../assets/IIT Ropar.png'
import { layout, card, primaryButton, secondaryButton, inputStyle, logoCircle } from '../styles/common'

type ManageEditProps = {
  fixedEntityType?: 'student' | 'admin'
}

export default function ManageEdit({ fixedEntityType }: ManageEditProps) {
  const [entityType, setEntityType] = useState<'student' | 'admin'>(fixedEntityType ?? 'student')
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
  const [hostels, setHostels] = useState<string[]>([])
  const [error, setError] = useState('')
  const [listData, setListData] = useState<{ name: string; email: string; id?: string; hostel: string; privilege?: string }[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [listFetchedFor, setListFetchedFor] = useState<'student' | 'admin' | null>(null)

  useEffect(() => {
    setEditTarget(null)
    setDeleteTarget(null)
    setEditFilterValue('')
    setDeleteFilterValue('')
    setEditResult('')
    setDeleteResult('')
    if (entityType === 'admin') {
      setEditFilterBy('email')
      setDeleteFilterBy('email')
    }
    setCsvFile(null)
    setCsvResult('')
    setListData([])
    setListFetchedFor(null)
  }, [entityType])

  useEffect(() => {
    if (fixedEntityType) {
      setEntityType(fixedEntityType)
    }
  }, [fixedEntityType])

  useEffect(() => {
    const loadHostels = async () => {
      try {
        const res = (await getHostelsList({})) as { hostelsList?: string[] }
        setHostels(Array.isArray(res?.hostelsList) ? res.hostelsList : [])
      } catch {
        setHostels([])
      }
    }
    loadHostels()
  }, [])

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
    if (!addName.trim() || !addEmail.trim() || !addPassword.trim()) {
      setError('Fill required add fields before submitting.')
      return
    }
    if (entityType === 'student' && (!addEntryNumber.trim() || !addHostelName.trim())) {
      setError('Student add requires entry number and hostel name.')
      return
    }
    if (entityType === 'admin' && !addAllocatedHostel.trim()) {
      setError('Admin add requires allocated hostel.')
      return
    }
    setLoading(true)
    try {
      const body = entityType === 'student'
        ? {
            type: 'student',
            name: addName.trim(),
            email: addEmail.trim(),
            password: addPassword,
            entry_number: addEntryNumber.trim(),
            hostel_name: addHostelName.trim(),
          }
        : {
            type: 'admin',
            name: addName.trim(),
            email: addEmail.trim(),
            password: addPassword,
            privelege: addPrivilege,
            allocatedHostel: addAllocatedHostel.trim(),
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
    if (!editName.trim() || !editEmail.trim() || !editPassword.trim()) {
      setError('Fill required edit fields before submitting.')
      return
    }
    if (entityType === 'student' && (!editEntryNumber.trim() || !editHostelName.trim())) {
      setError('Student edit requires entry number and hostel name.')
      return
    }
    if (entityType === 'admin' && !editAllocatedHostel.trim()) {
      setError('Admin edit requires allocated hostel.')
      return
    }
    setLoading(true)
    try {
      const body = entityType === 'student'
        ? {
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
          }
        : {
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
      const body = entityType === 'student'
        ? {
            type: 'student',
            filterBy: deleteTarget.filterBy,
            value: deleteTarget.value,
          }
        : {
            type: 'admin',
            filterBy: 'email',
            value: deleteTarget.value,
          }
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
    setEditTarget({ filterBy: entityType === 'admin' ? 'email' : editFilterBy, value })
  }

  const applyDeleteFilter = () => {
    setError('')
    setDeleteResult('')
    const value = deleteFilterValue.trim()
    if (!value) {
      setError('Enter email or entry number for Delete filter.')
      return
    }
    setDeleteTarget({ filterBy: entityType === 'admin' ? 'email' : deleteFilterBy, value })
  }

  const handleUploadCsv = async () => {
    if (!csvFile) { setError('Select a file'); return }
    setError('')
    setCsvResult('')
    setLoading(true)
    try {
      const form = new FormData()
      form.append('file', csvFile)
      const res = entityType === 'student'
        ? await uploadStudentCsv(form)
        : await uploadAdminCsv(form)
      const backendError = resolveBackendError(res)
      if (backendError) {
        setError(backendError)
      } else {
        setCsvResult(JSON.stringify(res, null, 2))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const handleLoadList = async () => {
    setLoadingList(true)
    setError('')
    try {
      const newList: { name: string; email: string; id?: string; hostel: string; privilege?: string }[] = []
      if (entityType === 'student') {
        const promises = hostels.map(h => getHostelList({ hostel_name: h, start: 1, num_students: 1000 }).then(res => ({ h, res: res as { studentsList?: string[][] } })).catch(() => ({ h, res: {} })))
        const results = await Promise.all(promises)
        for (const { h, res } of results) {
          if (res?.studentsList) {
            for (const row of res.studentsList) {
              newList.push({ name: row[0] || '', id: row[1] || '', email: row[2] || '', hostel: h })
            }
          }
        }
      } else {
        const privileges: AdminPrivilegeApiValue[] = ['super_user', 'top_privelege', 'gaurd']
        const promises = privileges.map(priv => getAdminList({ admin_privelege_name: priv, start: 1, num_users: 1000 }).then(res => ({ priv, res: res as { usersList?: string[][] } })).catch(() => ({ priv, res: {} })))
        const results = await Promise.all(promises)
        for (const { priv, res } of results) {
          if (res?.usersList) {
            for (const row of res.usersList) {
              newList.push({ name: row[0] || '', email: row[1] || '', hostel: row[2] || '', privilege: priv })
            }
          }
        }
      }
      setListData(newList)
      setListFetchedFor(entityType)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch list')
    } finally {
      setLoadingList(false)
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
            <Link to="/admin/manage" style={{ ...secondaryButton, textDecoration: 'none' }}>← Back to Manage list</Link>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>
              Manage {entityType} — Add, delete, edit
            </h1>
            <p style={{ fontSize: '1rem', color: '#9ca3af', marginBottom: '1.5rem' }}>
              [express] /upload-manually, /edit, /delete, /upload-csv
            </p>
            {error && <p style={{ color: '#f87171', marginBottom: '1rem' }}>{error}</p>}
            <div style={{ display: 'grid', gap: '1.5rem' }}>
          <section>
            {!fixedEntityType && (
              <>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Target type</h2>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <button type="button" style={entityType === 'student' ? primaryButton : secondaryButton} onClick={() => setEntityType('student')}>
                    Student
                  </button>
                  <button type="button" style={entityType === 'admin' ? primaryButton : secondaryButton} onClick={() => setEntityType('admin')}>
                    Admin
                  </button>
                </div>
              </>
            )}
          </section>
          <section>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Add {entityType}</h2>
            <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input type="text" style={inputStyle} placeholder="Name" value={addName} onChange={(e) => setAddName(e.target.value)} />
              <input type="email" style={inputStyle} placeholder="Email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} />
              <input type="password" style={inputStyle} placeholder="Password" value={addPassword} onChange={(e) => setAddPassword(e.target.value)} />
              {entityType === 'student' ? (
                <>
                  <input type="text" style={inputStyle} placeholder="Entry number" value={addEntryNumber} onChange={(e) => setAddEntryNumber(e.target.value)} />
                  <select
                    style={inputStyle}
                    value={addHostelName}
                    onChange={(e) => setAddHostelName(e.target.value)}
                  >
                    <option value="">Select hostel</option>
                    {hostels.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <select value={addPrivilege} onChange={(e) => setAddPrivilege(e.target.value as AdminPrivilegeApiValue)} style={inputStyle}>
                    <option value="gaurd">gaurd</option>
                    <option value="top_privelege">top_privelege</option>
                    <option value="super_user">super_user</option>
                  </select>
                  <select
                    style={inputStyle}
                    value={addAllocatedHostel}
                    onChange={(e) => setAddAllocatedHostel(e.target.value)}
                  >
                    <option value="">Select allocated hostel</option>
                    <option value="all">all</option>
                    {hostels.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </>
              )}
            </div>
            <button type="button" style={primaryButton} onClick={handleAddManually} disabled={loading}>Add</button>
            {addResult && <pre style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: 8 }}>{addResult}</pre>}
          </section>
          <section>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Edit {entityType}</h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.75rem' }}>
              {entityType === 'student' ? (
                <select
                  value={editFilterBy}
                  onChange={(e) => setEditFilterBy(e.target.value as 'email' | 'entry_number')}
                  style={{ ...inputStyle, maxWidth: 170 }}
                >
                  <option value="email">Filter by email</option>
                  <option value="entry_number">Filter by entry number</option>
                </select>
              ) : (
                <span style={{ color: '#9ca3af' }}>Filter by email</span>
              )}
              <input
                type="text"
                style={{ ...inputStyle, maxWidth: 280 }}
                placeholder={entityType === 'student' ? (editFilterBy === 'email' ? 'student@email.com' : 'Entry number') : 'admin@email.com'}
                value={editFilterValue}
                onChange={(e) => setEditFilterValue(e.target.value)}
              />
              <button type="button" style={secondaryButton} onClick={applyEditFilter} disabled={loading}>Filter</button>
            </div>
            {editTarget && (
              <p style={{ color: '#9ca3af', marginBottom: '0.75rem' }}>
                Selected {entityType}: {editTarget.filterBy} = {editTarget.value}
              </p>
            )}
            <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input type="text" style={inputStyle} placeholder="New name" value={editName} onChange={(e) => setEditName(e.target.value)} />
              <input type="email" style={inputStyle} placeholder="New email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              <input type="password" style={inputStyle} placeholder="New password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} />
              {entityType === 'student' ? (
                <>
                  <input type="text" style={inputStyle} placeholder="New entry number" value={editEntryNumber} onChange={(e) => setEditEntryNumber(e.target.value)} />
                  <select
                    style={inputStyle}
                    value={editHostelName}
                    onChange={(e) => setEditHostelName(e.target.value)}
                  >
                    <option value="">Select hostel</option>
                    {hostels.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <select value={editPrivilege} onChange={(e) => setEditPrivilege(e.target.value as AdminPrivilegeApiValue)} style={inputStyle}>
                    <option value="gaurd">gaurd</option>
                    <option value="top_privelege">top_privelege</option>
                    <option value="super_user">super_user</option>
                  </select>
                  <select
                    style={inputStyle}
                    value={editAllocatedHostel}
                    onChange={(e) => setEditAllocatedHostel(e.target.value)}
                  >
                    <option value="">Select allocated hostel</option>
                    <option value="all">all</option>
                    {hostels.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </>
              )}
            </div>
            <button type="button" style={primaryButton} onClick={handleEditUser} disabled={loading}>Edit</button>
            {editResult && <pre style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: 8 }}>{editResult}</pre>}
          </section>
          <section>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Delete {entityType}</h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.75rem' }}>
              {entityType === 'student' ? (
                <select
                  value={deleteFilterBy}
                  onChange={(e) => setDeleteFilterBy(e.target.value as 'email' | 'entry_number')}
                  style={{ ...inputStyle, maxWidth: 170 }}
                >
                  <option value="email">Filter by email</option>
                  <option value="entry_number">Filter by entry number</option>
                </select>
              ) : (
                <span style={{ color: '#9ca3af' }}>Filter by email</span>
              )}
              <input
                type="text"
                style={{ ...inputStyle, maxWidth: 280 }}
                placeholder={entityType === 'student' ? (deleteFilterBy === 'email' ? 'student@email.com' : 'Entry number') : 'admin@email.com'}
                value={deleteFilterValue}
                onChange={(e) => setDeleteFilterValue(e.target.value)}
              />
              <button type="button" style={secondaryButton} onClick={applyDeleteFilter} disabled={loading}>Filter</button>
            </div>
            {deleteTarget && (
              <p style={{ color: '#9ca3af', marginBottom: '0.75rem' }}>
                Selected {entityType}: {deleteTarget.filterBy} = {deleteTarget.value}
              </p>
            )}
            <button type="button" style={primaryButton} onClick={handleDeleteUser} disabled={loading}>Delete</button>
            {deleteResult && <pre style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: 8 }}>{deleteResult}</pre>}
          </section>
          <section>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              Upload CSV ({entityType === 'student' ? 'students' : 'admins'})
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '0.75rem' }}>
              {entityType === 'student'
                ? 'Header row required: name, email, password, entry_number, hostel_name'
                : 'Header row required: name, email, password, privelege, allocated_hostel (privelege: super_user | top_privelege | gaurd)'}
            </p>
            <input type="file" accept=".csv,text/csv" onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)} style={{ color: '#e5e7eb' }} />
            <button type="button" style={primaryButton} onClick={handleUploadCsv} disabled={loading || !csvFile}>
              {entityType === 'student' ? 'Upload student CSV' : 'Upload admin CSV'}
            </button>
            {csvResult && <pre style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: 8, overflow: 'auto' }}>{csvResult}</pre>}
          </section>
          <section>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>View {entityType}s List</span>
              <button type="button" style={{ ...secondaryButton, padding: '0.5rem 1rem', fontSize: '0.9rem' }} onClick={handleLoadList} disabled={loadingList}>
                {loadingList ? 'Loading...' : 'Load List'}
              </button>
            </h2>
            {listFetchedFor === entityType && listData.length > 0 && (
              <div style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 8, overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '0.5rem' }}>Name</th>
                      <th style={{ padding: '0.5rem' }}>Email</th>
                      {entityType === 'student' && <th style={{ padding: '0.5rem' }}>Entry Number</th>}
                      <th style={{ padding: '0.5rem' }}>Hostel</th>
                      {entityType === 'admin' && <th style={{ padding: '0.5rem' }}>Privilege</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {listData.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.5rem' }}>{item.name}</td>
                        <td style={{ padding: '0.5rem' }}>{item.email}</td>
                        {entityType === 'student' && <td style={{ padding: '0.5rem' }}>{item.id}</td>}
                        <td style={{ padding: '0.5rem' }}>{item.hostel}</td>
                        {entityType === 'admin' && <td style={{ padding: '0.5rem' }}>{item.privilege}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {listFetchedFor === entityType && listData.length === 0 && !loadingList && (
              <p style={{ color: '#9ca3af', marginTop: '0.5rem' }}>No {entityType}s found.</p>
            )}
          </section>
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
