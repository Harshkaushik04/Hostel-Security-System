import { Link } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { addManually, deleteUser, editUser } from '../../../src/api/endpoints'
import { styles } from '../../../src/ui/styles'

export default function ManageEdit() {
  const [addName, setAddName] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [addPassword, setAddPassword] = useState('')
  const [addEntryNumber, setAddEntryNumber] = useState('')
  const [addHostelName, setAddHostelName] = useState('')
  const [addResult, setAddResult] = useState('')
  const [editFilterBy, setEditFilterBy] = useState<'email' | 'entry_number'>('email')
  const [editFilterValue, setEditFilterValue] = useState('')
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editEntryNumber, setEditEntryNumber] = useState('')
  const [editHostelName, setEditHostelName] = useState('')
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
    if (!addName.trim() || !addEmail.trim() || !addPassword.trim() || !addEntryNumber.trim() || !addHostelName.trim()) {
      setError('Fill all add-student fields before submitting.')
      return
    }
    setLoading(true)
    try {
      const res = await addManually({
        type: 'student',
        name: addName.trim(),
        email: addEmail.trim(),
        password: addPassword,
        entry_number: addEntryNumber.trim(),
        hostel_name: addHostelName.trim(),
      })
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
    if (!editName.trim() || !editEmail.trim() || !editPassword.trim() || !editEntryNumber.trim() || !editHostelName.trim()) {
      setError('Fill all edit fields before submitting.')
      return
    }
    setLoading(true)
    try {
      const res = await editUser({
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
      })
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
      const res = await deleteUser({
        type: 'student',
        filterBy: deleteFilterBy,
        value: deleteFilterValue.trim(),
      })
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
          <Pressable style={[styles.buttonSecondary, { marginBottom: 12 }]}>
            <Text style={styles.buttonTextSecondary}>← Back to Manage list</Text>
          </Pressable>
        </Link>

        <Text style={styles.title}>Manage users — Add / Delete / Edit</Text>
        <Text style={styles.subtitle}>[express] /add-manually, /edit, /delete</Text>

        <Text style={styles.label}>Add student</Text>
        <TextInput style={styles.input} value={addName} onChangeText={setAddName} placeholder="Name" placeholderTextColor="#64748b" />
        <TextInput style={styles.input} value={addEmail} onChangeText={setAddEmail} placeholder="Email" autoCapitalize="none" placeholderTextColor="#64748b" />
        <TextInput style={styles.input} value={addPassword} onChangeText={setAddPassword} placeholder="Password" placeholderTextColor="#64748b" />
        <TextInput style={styles.input} value={addEntryNumber} onChangeText={setAddEntryNumber} placeholder="Entry number" placeholderTextColor="#64748b" />
        <TextInput style={styles.input} value={addHostelName} onChangeText={setAddHostelName} placeholder="Hostel name" placeholderTextColor="#64748b" />
        <Pressable style={[styles.buttonPrimary, { marginTop: 8 }]} onPress={onAdd} disabled={loading}>
          <Text style={styles.buttonTextPrimary}>{loading ? 'Submitting…' : 'Add'}</Text>
        </Pressable>
        {!!addResult && <Text style={[styles.code, { marginTop: 8 }]}>{addResult}</Text>}

        <Text style={[styles.label, { marginTop: 16 }]}>Edit student</Text>
        <TextInput
          style={styles.input}
          value={editFilterBy}
          onChangeText={(t) => setEditFilterBy(t === 'entry_number' ? 'entry_number' : 'email')}
          placeholder='Filter by: "email" or "entry_number"'
          placeholderTextColor="#64748b"
        />
        <TextInput style={styles.input} value={editFilterValue} onChangeText={setEditFilterValue} placeholder="Filter value" placeholderTextColor="#64748b" />
        <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholder="New name" placeholderTextColor="#64748b" />
        <TextInput style={styles.input} value={editEmail} onChangeText={setEditEmail} placeholder="New email" placeholderTextColor="#64748b" />
        <TextInput style={styles.input} value={editPassword} onChangeText={setEditPassword} placeholder="New password" placeholderTextColor="#64748b" />
        <TextInput style={styles.input} value={editEntryNumber} onChangeText={setEditEntryNumber} placeholder="New entry number" placeholderTextColor="#64748b" />
        <TextInput style={styles.input} value={editHostelName} onChangeText={setEditHostelName} placeholder="New hostel name" placeholderTextColor="#64748b" />
        <Pressable style={styles.buttonPrimary} onPress={onEdit} disabled={loading}>
          <Text style={styles.buttonTextPrimary}>{loading ? 'Submitting…' : 'Edit'}</Text>
        </Pressable>
        {!!editResult && <Text style={[styles.code, { marginTop: 8 }]}>{editResult}</Text>}

        <Text style={[styles.label, { marginTop: 16 }]}>Delete student</Text>
        <TextInput
          style={styles.input}
          value={deleteFilterBy}
          onChangeText={(t) => setDeleteFilterBy(t === 'entry_number' ? 'entry_number' : 'email')}
          placeholder='Filter by: "email" or "entry_number"'
          placeholderTextColor="#64748b"
        />
        <TextInput style={styles.input} value={deleteFilterValue} onChangeText={setDeleteFilterValue} placeholder="Filter value" placeholderTextColor="#64748b" />
        <Pressable style={styles.buttonPrimary} onPress={onDelete} disabled={loading}>
          <Text style={styles.buttonTextPrimary}>{loading ? 'Submitting…' : 'Delete'}</Text>
        </Pressable>
        {!!deleteResult && <Text style={[styles.code, { marginTop: 8 }]}>{deleteResult}</Text>}

        {!!error && <Text style={[styles.error, { marginTop: 8 }]}>{error}</Text>}
      </View>
    </ScrollView>
  )
}

