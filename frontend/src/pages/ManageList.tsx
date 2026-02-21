import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getHostelsList, getHostelList, getAdminList } from '../api/endpoints'
import { layout, card, primaryButton, secondaryButton, inputStyle } from '../styles/common'

type Tab = 'hostels' | 'admin'
const ADMIN_PRIVILEGES = ['guard', 'top privilege', 'super user'] as const

export default function ManageList() {
  const [tab, setTab] = useState<Tab>('hostels')
  const [hostelName, setHostelName] = useState('')
  const [hostels, setHostels] = useState<string[]>([])
  const [users, setUsers] = useState<unknown[]>([])
  const [fromK, setFromK] = useState(0)
  const [toK, setToK] = useState(10)
  const [selectedHostel, setSelectedHostel] = useState<string | null>(null)
  const [selectedPrivilege, setSelectedPrivilege] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (tab !== 'hostels') {
      setHostels([])
      return
    }
    setError('')
    setLoading(true)
    getHostelsList({ hostel_name: hostelName || undefined })
      .then((res) => {
        const list = (res as { hostels?: string[] })?.hostels ?? (Array.isArray(res) ? res : [])
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
    getHostelList({ hostel_name: name, from: fromK, to: toK })
      .then((res) => {
        const list = (res as { users?: unknown[] })?.users ?? (Array.isArray(res) ? res : [])
        setUsers(list)
      })
      .catch((e) => { setError(e instanceof Error ? e.message : 'Failed'); setUsers([]) })
      .finally(() => setLoading(false))
  }

  const loadAdminUsers = (privilege: string) => {
    setSelectedPrivilege(privilege)
    setSelectedHostel(null)
    setError('')
    setLoading(true)
    getAdminList({ admin_privilege_name: privilege, from: fromK, to: toK })
      .then((res) => {
        const list = (res as { users?: unknown[] })?.users ?? (Array.isArray(res) ? res : [])
        setUsers(list)
      })
      .catch((e) => { setError(e instanceof Error ? e.message : 'Failed'); setUsers([]) })
      .finally(() => setLoading(false))
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
              <button key={p} type="button" style={secondaryButton} onClick={() => loadAdminUsers(p)}>{p}</button>
            ))}
          </div>
        )}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.9rem', color: '#e5e7eb' }}>Range from </label>
          <input type="number" style={{ ...inputStyle, width: 80 }} value={fromK} onChange={(e) => setFromK(Number(e.target.value))} />
          <label style={{ fontSize: '0.9rem', color: '#e5e7eb', marginLeft: '0.5rem' }}>to </label>
          <input type="number" style={{ ...inputStyle, width: 80 }} value={toK} onChange={(e) => setToK(Number(e.target.value))} />
        </div>
        {(selectedHostel || selectedPrivilege) && (
          <>
            {loading && <p style={{ color: '#9ca3af' }}>Loading users…</p>}
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {users.map((u, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ flex: 1 }}>{JSON.stringify(u)}</span>
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
