import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  getHostelsList,
  getHostelList,
  getAdminList,
  addHostel,
  type AdminPrivilegeApiValue,
} from '../api/endpoints'
import { layout, card, primaryButton, secondaryButton, inputStyle } from '../styles/common'

type Tab = 'hostels' | 'admin'
const ADMIN_PRIVILEGES: { label: string; value: AdminPrivilegeApiValue }[] = [
  { label: 'Guard', value: 'gaurd' },
  { label: 'Top privilege', value: 'top_privelege' },
  { label: 'Super user', value: 'super_user' },
]

export default function ManageList() {
  const [tab, setTab] = useState<Tab>('hostels')
  const [hostelName, setHostelName] = useState('')
  const [hostels, setHostels] = useState<string[]>([])
  const [users, setUsers] = useState<string[][]>([])
  const [startK, setStartK] = useState(1)
  const [countK, setCountK] = useState(10)
  const [selectedHostel, setSelectedHostel] = useState<string | null>(null)
  const [selectedPrivilege, setSelectedPrivilege] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [newHostel, setNewHostel] = useState('')
  const [addingHostel, setAddingHostel] = useState(false)

  useEffect(() => {
    if (tab !== 'hostels') {
      setHostels([])
      return
    }
    setError('')
    setLoading(true)
    getHostelsList({ hostel_name: hostelName || undefined })
      .then((res) => {
        const list =
          (res as { hostelsList?: string[] })?.hostelsList ??
          (Array.isArray(res) ? (res as string[]) : [])
        setHostels(list)
      })
      .catch((e) => { setError(e instanceof Error ? e.message : 'Failed'); setHostels([]) })
      .finally(() => setLoading(false))
  }, [tab, hostelName])

  const loadHostelUsers = (name: string) => {
    setSelectedHostel(name)
    setSelectedPrivilege(null)
    setError('')
    setLoading(true)
    getHostelList({ hostel_name: name, start: startK, num_students: countK })
      .then((res) => {
        const list =
          (res as { studentsList?: string[][] })?.studentsList ??
          (Array.isArray(res) ? (res as string[][]) : [])
        setUsers(list)
      })
      .catch((e) => { setError(e instanceof Error ? e.message : 'Failed'); setUsers([]) })
      .finally(() => setLoading(false))
  }

  const loadAdminUsers = (privilegeLabel: string, privilegeValue: AdminPrivilegeApiValue) => {
    setSelectedPrivilege(privilegeLabel)
    setSelectedHostel(null)
    setError('')
    setLoading(true)
    getAdminList({ admin_privelege_name: privilegeValue, start: startK, num_users: countK })
      .then((res) => {
        const list =
          (res as { usersList?: string[][] })?.usersList ??
          (Array.isArray(res) ? (res as string[][]) : [])
        setUsers(list)
      })
      .catch((e) => { setError(e instanceof Error ? e.message : 'Failed'); setUsers([]) })
      .finally(() => setLoading(false))
  }

  const handleAddHostel = async () => {
    const trimmed = newHostel.trim()
    if (!trimmed) return
    setError('')
    setAddingHostel(true)
    try {
      const res = await addHostel({ hostel_name: trimmed }) as { approved?: boolean; error?: string }
      if (!res.approved) {
        setError(res.error ?? 'Failed to add hostel')
      } else {
        setNewHostel('')
        // Refresh hostels list after successful addition
        const hostelsRes = await getHostelsList({})
        const list =
          (hostelsRes as { hostelsList?: string[] })?.hostelsList ??
          (Array.isArray(hostelsRes) ? (hostelsRes as string[]) : [])
        setHostels(list)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add hostel')
    } finally {
      setAddingHostel(false)
    }
  }

  return (
    <div style={layout}>
      <div style={card}>
        <Link to="/admin" style={{ ...secondaryButton, textDecoration: 'none' }}>← Back to Admin</Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>
          Manage students / admin list
        </h1>
        <p style={{ fontSize: '1rem', color: '#9ca3af', marginBottom: '1rem' }}>
          Hostels or Admin privileges. get-hostels-list, get-hostel-list, get-admin-list (range k1–k2).
        </p>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <button type="button" style={tab === 'hostels' ? primaryButton : secondaryButton} onClick={() => setTab('hostels')}>Hostels</button>
          <button type="button" style={tab === 'admin' ? primaryButton : secondaryButton} onClick={() => setTab('admin')}>Admin</button>
        </div>
        {tab === 'hostels' && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.9rem', color: '#e5e7eb' }}>Hostel name filter </label>
              <input type="text" style={{ ...inputStyle, maxWidth: 300 }} value={hostelName} onChange={(e) => setHostelName(e.target.value)} placeholder="Optional" />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.9rem', color: '#e5e7eb', display: 'block', marginBottom: '0.25rem' }}>
                Add hostel
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="text"
                  style={{ ...inputStyle, maxWidth: 260 }}
                  placeholder="New hostel name"
                  value={newHostel}
                  onChange={(e) => setNewHostel(e.target.value)}
                />
                <button
                  type="button"
                  style={primaryButton}
                  onClick={handleAddHostel}
                  disabled={addingHostel}
                >
                  {addingHostel ? 'Adding…' : 'Add hostel'}
                </button>
              </div>
            </div>
            {loading && <p style={{ color: '#9ca3af' }}>Loading…</p>}
            {error && <p style={{ color: '#f87171' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {hostels.map((h) => (
                <button key={h} type="button" style={secondaryButton} onClick={() => loadHostelUsers(h)}>{h}</button>
              ))}
            </div>
          </>
        )}
        {tab === 'admin' && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {ADMIN_PRIVILEGES.map((p) => (
              <button
                key={p.value}
                type="button"
                style={secondaryButton}
                onClick={() => loadAdminUsers(p.label, p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.9rem', color: '#e5e7eb' }}>Start (1-based)</label>
          <input
            type="number"
            style={{ ...inputStyle, width: 80, marginRight: '0.5rem' }}
            min={1}
            value={startK}
            onChange={(e) => setStartK(Number(e.target.value) || 1)}
          />
          <label style={{ fontSize: '0.9rem', color: '#e5e7eb', marginRight: '0.5rem' }}>Count</label>
          <input
            type="number"
            style={{ ...inputStyle, width: 80 }}
            min={1}
            value={countK}
            onChange={(e) => setCountK(Number(e.target.value) || 1)}
          />
        </div>
        {(selectedHostel || selectedPrivilege) && (
          <>
            {loading && <p style={{ color: '#9ca3af' }}>Loading users…</p>}
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {users.map((u, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ flex: 1 }}>
                    {selectedHostel
                      ? `${u[0] ?? ''} (${u[1] ?? ''}) — ${u[2] ?? ''}`
                      : `${u[0] ?? ''} — ${u[1] ?? ''}`}
                  </span>
                  <Link to="/admin/manage/edit" style={{ ...secondaryButton, textDecoration: 'none' }}>Edit</Link>
                </li>
              ))}
            </ul>
          </>
        )}
        <div style={{ marginTop: '1.5rem' }}>
          <Link to="/admin/manage/edit" style={{ ...primaryButton, textDecoration: 'none' }}>Add / Delete / Edit users →</Link>
        </div>
      </div>
    </div>
  )
}
