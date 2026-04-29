import { Link, useLocalSearchParams } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { addManually, deleteUser, editUser, type AdminPrivilegeApiValue } from '../../../src/api/endpoints'
import { styles } from '../../../src/ui/styles'

const PRIVILEGES: { label: string; value: AdminPrivilegeApiValue }[] = [
  { label: 'Guard', value: 'gaurd' },
  { label: 'Top privilege', value: 'top_privelege' },
  { label: 'Super user', value: 'super_user' },
]

export default function ManageEdit() {
  const params = useLocalSearchParams<{ type?: string }>()
  const initialType = useMemo<'student' | 'admin'>(() => {
    const t = (params.type ?? '').toLowerCase()
    return t === 'admin' ? 'admin' : 'student'
  }, [params.type])
  const [userType, setUserType] = useState<'student' | 'admin'>(initialType)

  const [addName, setAddName] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [addPassword, setAddPassword] = useState('')
  const [addEntryNumber, setAddEntryNumber] = useState('')
  const [addHostelName, setAddHostelName] = useState('')
  const [addPrivilege, setAddPrivilege] = useState<AdminPrivilegeApiValue>('gaurd')
  const [addAllocatedHostel, setAddAllocatedHostel] = useState('')
  const [addResult, setAddResult] = useState('')
  const [editFilterBy, setEditFilterBy] = useState<'email' | 'entry_number'>('email')
  const [editFilterValue, setEditFilterValue] = useState('')
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editEntryNumber, setEditEntryNumber] = useState('')
  const [editHostelName, setEditHostelName] = useState('')
  const [editPrivilege, setEditPrivilege] = useState<AdminPrivilegeApiValue>('gaurd')
  const [editAllocatedHostel, setEditAllocatedHostel] = useState('')
  const [editResult, setEditResult] = useState('')
  const [deleteFilterBy, setDeleteFilterBy] = useState<'email' | 'entry_number'>('email')
  const [deleteFilterValue, setDeleteFilterValue] = useState('')
  const [deleteResult, setDeleteResult] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

  const onAdd = async () => {
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
        setAddResult(JSON.stringify(res, null, 2))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  const onEdit = async () => {
    setError('')
    setEditResult('')
    if (!editFilterValue.trim()) {
      setError('Enter filter value for edit.')
      return
    }
    setLoading(true)
    try {
      const body =
        userType === 'student'
          ? ({
              type: 'student',
              filterBy: editFilterBy,
              value: editFilterValue.trim(),
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
              value: editFilterValue.trim(),
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
      if (backendError) setError(backendError)
      else setEditResult(JSON.stringify(res, null, 2))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  const onDelete = async () => {
    setError('')
    setDeleteResult('')
    if (!deleteFilterValue.trim()) {
      setError('Enter filter value for delete.')
      return
    }
    setLoading(true)
    try {
      const body =
        userType === 'student'
          ? ({
              type: 'student',
              filterBy: deleteFilterBy,
              value: deleteFilterValue.trim(),
            } as const)
          : ({
              type: 'admin',
              filterBy: 'email',
              value: deleteFilterValue.trim(),
            } as const)
      const res = await deleteUser(body)
      const backendError = resolveBackendError(res)
      if (backendError) setError(backendError)
      else setDeleteResult(JSON.stringify(res, null, 2))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.card}>
        <Link href="/admin/manage" asChild>
          <Pressable style={StyleSheet.flatten([styles.buttonSecondary, { marginBottom: 12 }])}>
            <Text style={styles.buttonTextSecondary}>← Back to Manage list</Text>
          </Pressable>
        </Link>

        <Text style={styles.title}>Manage users</Text>
        <Text style={styles.subtitle}>[express] /upload-manually, /edit, /delete</Text>

        <View style={[styles.row, { marginTop: 8, marginBottom: 8 }]}>
          <Pressable
            style={userType === 'student' ? styles.buttonPrimary : styles.buttonSecondary}
            onPress={() => {
              setUserType('student')
              setError('')
              setAddResult('')
              setEditResult('')
              setDeleteResult('')
            }}
          >
            <Text style={userType === 'student' ? styles.buttonTextPrimary : styles.buttonTextSecondary}>Student</Text>
          </Pressable>
          <Pressable
            style={userType === 'admin' ? styles.buttonPrimary : styles.buttonSecondary}
            onPress={() => {
              setUserType('admin')
              setEditFilterBy('email')
              setDeleteFilterBy('email')
              setError('')
              setAddResult('')
              setEditResult('')
              setDeleteResult('')
            }}
          >
            <Text style={userType === 'admin' ? styles.buttonTextPrimary : styles.buttonTextSecondary}>Admin</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Add {userType === 'admin' ? 'admin' : 'student'}</Text>
        <TextInput style={styles.input} value={addName} onChangeText={setAddName} placeholder="Name" placeholderTextColor="#64748b" />
        <TextInput style={styles.input} value={addEmail} onChangeText={setAddEmail} placeholder="Email" autoCapitalize="none" placeholderTextColor="#64748b" />
        <TextInput style={styles.input} value={addPassword} onChangeText={setAddPassword} placeholder="Password" placeholderTextColor="#64748b" />
        {userType === 'student' ? (
          <>
            <TextInput style={styles.input} value={addEntryNumber} onChangeText={setAddEntryNumber} placeholder="Entry number" placeholderTextColor="#64748b" />
            <TextInput style={styles.input} value={addHostelName} onChangeText={setAddHostelName} placeholder="Hostel name" placeholderTextColor="#64748b" />
          </>
        ) : (
          <>
            <Text style={styles.label}>Privilege</Text>
            <View style={[styles.row, { marginBottom: 12 }]}>
              {PRIVILEGES.map((p) => (
                <Pressable
                  key={p.value}
                  style={addPrivilege === p.value ? styles.buttonPrimary : styles.buttonSecondary}
                  onPress={() => setAddPrivilege(p.value)}
                >
                  <Text style={addPrivilege === p.value ? styles.buttonTextPrimary : styles.buttonTextSecondary}>{p.label}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput style={styles.input} value={addAllocatedHostel} onChangeText={setAddAllocatedHostel} placeholder="Allocated hostel" placeholderTextColor="#64748b" />
          </>
        )}
        <Pressable style={[styles.buttonPrimary, { marginTop: 8 }]} onPress={onAdd} disabled={loading}>
          <Text style={styles.buttonTextPrimary}>{loading ? 'Submitting…' : 'Add'}</Text>
        </Pressable>
        {!!addResult && <Text style={[styles.code, { marginTop: 8 }]}>{addResult}</Text>}

        <Text style={[styles.label, { marginTop: 16 }]}>Edit {userType === 'admin' ? 'admin' : 'student'}</Text>
        {userType === 'student' ? (
          <TextInput
            style={styles.input}
            value={editFilterBy}
            onChangeText={(t) => setEditFilterBy(t === 'entry_number' ? 'entry_number' : 'email')}
            placeholder='Filter by: "email" or "entry_number"'
            placeholderTextColor="#64748b"
          />
        ) : (
          <Text style={styles.subtitle}>Filter by email</Text>
        )}
        <TextInput
          style={styles.input}
          value={editFilterValue}
          onChangeText={setEditFilterValue}
          placeholder={userType === 'admin' || editFilterBy === 'email' ? 'email@example.com' : 'Entry number'}
          placeholderTextColor="#64748b"
          autoCapitalize="none"
        />
        <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholder="New name" placeholderTextColor="#64748b" />
        <TextInput style={styles.input} value={editEmail} onChangeText={setEditEmail} placeholder="New email" placeholderTextColor="#64748b" autoCapitalize="none" />
        <TextInput style={styles.input} value={editPassword} onChangeText={setEditPassword} placeholder="New password" placeholderTextColor="#64748b" />
        {userType === 'student' ? (
          <>
            <TextInput style={styles.input} value={editEntryNumber} onChangeText={setEditEntryNumber} placeholder="New entry number" placeholderTextColor="#64748b" />
            <TextInput style={styles.input} value={editHostelName} onChangeText={setEditHostelName} placeholder="New hostel name" placeholderTextColor="#64748b" />
          </>
        ) : (
          <>
            <Text style={styles.label}>Privilege</Text>
            <View style={[styles.row, { marginBottom: 12 }]}>
              {PRIVILEGES.map((p) => (
                <Pressable
                  key={p.value}
                  style={editPrivilege === p.value ? styles.buttonPrimary : styles.buttonSecondary}
                  onPress={() => setEditPrivilege(p.value)}
                >
                  <Text style={editPrivilege === p.value ? styles.buttonTextPrimary : styles.buttonTextSecondary}>{p.label}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput style={styles.input} value={editAllocatedHostel} onChangeText={setEditAllocatedHostel} placeholder="Allocated hostel" placeholderTextColor="#64748b" />
          </>
        )}
        <Pressable style={styles.buttonPrimary} onPress={onEdit} disabled={loading}>
          <Text style={styles.buttonTextPrimary}>{loading ? 'Submitting…' : 'Edit'}</Text>
        </Pressable>
        {!!editResult && <Text style={[styles.code, { marginTop: 8 }]}>{editResult}</Text>}

        <Text style={[styles.label, { marginTop: 16 }]}>Delete {userType === 'admin' ? 'admin' : 'student'}</Text>
        {userType === 'student' ? (
          <TextInput
            style={styles.input}
            value={deleteFilterBy}
            onChangeText={(t) => setDeleteFilterBy(t === 'entry_number' ? 'entry_number' : 'email')}
            placeholder='Filter by: "email" or "entry_number"'
            placeholderTextColor="#64748b"
          />
        ) : (
          <Text style={styles.subtitle}>Filter by email</Text>
        )}
        <TextInput
          style={styles.input}
          value={deleteFilterValue}
          onChangeText={setDeleteFilterValue}
          placeholder={userType === 'admin' || deleteFilterBy === 'email' ? 'email@example.com' : 'Entry number'}
          placeholderTextColor="#64748b"
          autoCapitalize="none"
        />
        <Pressable style={styles.buttonPrimary} onPress={onDelete} disabled={loading}>
          <Text style={styles.buttonTextPrimary}>{loading ? 'Submitting…' : 'Delete'}</Text>
        </Pressable>
        {!!deleteResult && <Text style={[styles.code, { marginTop: 8 }]}>{deleteResult}</Text>}

        {!!error && <Text style={[styles.error, { marginTop: 8 }]}>{error}</Text>}
      </View>
    </ScrollView>
  )
}

