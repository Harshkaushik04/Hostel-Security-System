import { Link } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import {
  addHostel,
  getAdminUsersList,
  getHostelStudentsList,
  getHostelsList,
  type AdminPrivilegeApiValue,
} from '../../../src/api/endpoints'
import { styles } from '../../../src/ui/styles'

type Tab = 'hostels' | 'admin'

const PRIVILEGES: { label: string; value: AdminPrivilegeApiValue }[] = [
  { label: 'Guard', value: 'gaurd' },
  { label: 'Top privilege', value: 'top_privelege' },
  { label: 'Super user', value: 'super_user' },
]

export default function ManageList() {
  const [tab, setTab] = useState<Tab>('hostels')
  const [hostelFilter, setHostelFilter] = useState('')
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
    if (tab !== 'hostels') return
    let cancelled = false
    setLoading(true)
    setError('')
    getHostelsList({ hostel_name: hostelFilter || undefined })
      .then((res) => {
        const list =
          (res as { hostelsList?: string[] })?.hostelsList ??
          (Array.isArray(res) ? (res as string[]) : [])
        if (!cancelled) setHostels(list)
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed')
          setHostels([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tab, hostelFilter])

  const loadHostelUsers = (hostel: string) => {
    setSelectedHostel(hostel)
    setSelectedPrivilege(null)
    setLoading(true)
    setError('')
    getHostelStudentsList({ hostel_name: hostel, start: startK, num_students: countK })
      .then((res) => {
        const list =
          (res as { studentsList?: string[][] })?.studentsList ??
          (Array.isArray(res) ? (res as string[][]) : [])
        setUsers(list)
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed')
        setUsers([])
      })
      .finally(() => setLoading(false))
  }

  const loadAdminUsers = (label: string, value: AdminPrivilegeApiValue) => {
    setSelectedPrivilege(label)
    setSelectedHostel(null)
    setLoading(true)
    setError('')
    getAdminUsersList({ admin_privelege_name: value, start: startK, num_users: countK })
      .then((res) => {
        const list =
          (res as { usersList?: string[][] })?.usersList ??
          (Array.isArray(res) ? (res as string[][]) : [])
        setUsers(list)
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed')
        setUsers([])
      })
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
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.card}>
        <Link href="/admin" asChild>
          <Pressable style={[styles.buttonSecondary, { marginBottom: 12 }]}>
            <Text style={styles.buttonTextSecondary}>← Back to Admin</Text>
          </Pressable>
        </Link>

        <Text style={styles.title}>Manage students / admin list</Text>

        <View style={[styles.row, { marginVertical: 12 }]}>
          <Pressable
            style={tab === 'hostels' ? styles.buttonPrimary : styles.buttonSecondary}
            onPress={() => setTab('hostels')}
          >
            <Text
              style={tab === 'hostels' ? styles.buttonTextPrimary : styles.buttonTextSecondary}
            >
              Hostels
            </Text>
          </Pressable>
          <Pressable
            style={tab === 'admin' ? styles.buttonPrimary : styles.buttonSecondary}
            onPress={() => setTab('admin')}
          >
            <Text
              style={tab === 'admin' ? styles.buttonTextPrimary : styles.buttonTextSecondary}
            >
              Admin
            </Text>
          </Pressable>
        </View>

        {tab === 'hostels' && (
          <>
            <Text style={styles.label}>Hostel name filter</Text>
            <TextInput
              value={hostelFilter}
              onChangeText={setHostelFilter}
              style={styles.input}
              placeholder="Optional"
              placeholderTextColor="#64748b"
            />

            <Text style={styles.label}>Add hostel</Text>
            <View style={[styles.row, { marginBottom: 12 }]}>
              <TextInput
                value={newHostel}
                onChangeText={setNewHostel}
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="New hostel name"
                placeholderTextColor="#64748b"
              />
              <Pressable
                style={styles.buttonPrimary}
                onPress={handleAddHostel}
                disabled={addingHostel}
              >
                <Text style={styles.buttonTextPrimary}>
                  {addingHostel ? 'Adding…' : 'Add'}
                </Text>
              </Pressable>
            </View>

            {loading && <Text style={styles.subtitle}>Loading…</Text>}
            {!!error && <Text style={styles.error}>{error}</Text>}

            <View style={[styles.row, { marginBottom: 12 }]}>
              {hostels.map((h) => (
                <Pressable
                  key={h}
                  style={styles.buttonSecondary}
                  onPress={() => loadHostelUsers(h)}
                >
                  <Text style={styles.buttonTextSecondary}>{h}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {tab === 'admin' && (
          <>
            <Text style={styles.label}>Privileges</Text>
            <View style={[styles.row, { marginBottom: 12 }]}>
              {PRIVILEGES.map((p) => (
                <Pressable
                  key={p.value}
                  style={styles.buttonSecondary}
                  onPress={() => loadAdminUsers(p.label, p.value)}
                >
                  <Text style={styles.buttonTextSecondary}>{p.label}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <Text style={styles.label}>Range</Text>
        <View style={[styles.row, { marginBottom: 12 }]}>
          <TextInput
            style={[styles.input, { width: 80, marginBottom: 0 }]}
            keyboardType="numeric"
            value={String(startK)}
            onChangeText={(t) => setStartK(Number(t) || 1)}
          />
          <Text style={styles.label}>Count</Text>
          <TextInput
            style={[styles.input, { width: 80, marginBottom: 0 }]}
            keyboardType="numeric"
            value={String(countK)}
            onChangeText={(t) => setCountK(Number(t) || 1)}
          />
        </View>

        {(selectedHostel || selectedPrivilege) && (
          <>
            {loading && <Text style={styles.subtitle}>Loading users…</Text>}
            <View style={{ marginTop: 8, gap: 8 }}>
              {users.map((u, i) => (
                <View
                  key={`${u[1] ?? i}`}
                  style={[
                    styles.buttonSecondary,
                    { flexDirection: 'row', justifyContent: 'space-between' },
                  ]}
                >
                  <Text style={styles.buttonTextSecondary}>
                    {selectedHostel
                      ? `${u[0] ?? ''} (${u[1] ?? ''}) — ${u[2] ?? ''}`
                      : `${u[0] ?? ''} — ${u[1] ?? ''}`}
                  </Text>
                  <Link href="/admin/manage/edit" asChild>
                    <Pressable>
                      <Text style={styles.buttonTextSecondary}>Edit</Text>
                    </Pressable>
                  </Link>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ marginTop: 16 }}>
          <Link href="/admin/manage/edit" asChild>
            <Pressable style={styles.buttonPrimary}>
              <Text style={styles.buttonTextPrimary}>Add / Delete / Edit users →</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </ScrollView>
  )
}

