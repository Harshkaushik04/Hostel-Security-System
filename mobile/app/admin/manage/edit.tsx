import { Link } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { uploadManually } from '../../../src/api/endpoints'
import { styles } from '../../../src/ui/styles'

export default function ManageEdit() {
  const [jsonInput, setJsonInput] = useState('')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async () => {
    setError('')
    setLoading(true)
    setResult('')
    try {
      const body = JSON.parse(jsonInput || '{}')
      const res = await uploadManually(body)
      setResult(JSON.stringify(res, null, 2))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON or request failed')
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
        <Text style={styles.subtitle}>[express] POST /upload-manually</Text>

        <Text style={styles.label}>Manual JSON payload</Text>
        <TextInput
          style={[styles.input, { minHeight: 140, textAlignVertical: 'top' }]}
          multiline
          value={jsonInput}
          onChangeText={setJsonInput}
          placeholder='{"type":"student","name":"...","entry_number":"...","hostel_name":"...","email":"...","password":"..."}'
          placeholderTextColor="#64748b"
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={[styles.buttonPrimary, { marginTop: 8 }]} onPress={onSubmit} disabled={loading}>
          <Text style={styles.buttonTextPrimary}>{loading ? 'Submitting…' : 'Submit'}</Text>
        </Pressable>

        {!!result && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.label}>Response</Text>
            <Text style={styles.code}>{result}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

