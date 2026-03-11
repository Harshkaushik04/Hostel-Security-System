import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { invite, type InviteBody } from '../src/api/endpoints'
import { styles } from '../src/ui/styles'

type KV = { key: string; value: string }

export default function VisitorEntry() {
  const [hostEmail, setHostEmail] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestContact, setGuestContact] = useState('')
  const [extra, setExtra] = useState<KV[]>([{ key: '', value: '' }])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const addField = () => setExtra((p) => [...p, { key: '', value: '' }])
  const removeField = (i: number) => setExtra((p) => p.filter((_, idx) => idx !== i))
  const updateField = (i: number, which: 'key' | 'value', value: string) => {
    setExtra((p) => {
      const next = [...p]
      next[i] = { ...next[i], [which]: value }
      return next
    })
  }

  const onSubmit = async () => {
    setError('')
    setLoading(true)
    const body: InviteBody = {
      host_email: hostEmail,
      guest_name: guestName,
      guest_contact_number: guestContact,
    }
    extra.forEach(({ key, value }) => {
      const k = key.trim()
      if (k) body[k] = value
    })
    try {
      await invite(body as InviteBody)
      router.replace('/emergencies')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invite failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.card}>
        <Text style={styles.title}>Visitor Entry</Text>
        <Text style={styles.subtitle}>
          Invite a guest. Optional key-value fields (e.g. WhatsApp contact).
        </Text>

        <Text style={styles.label}>Host email</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          value={hostEmail}
          onChangeText={setHostEmail}
          style={styles.input}
          placeholder="Your email (host)"
          placeholderTextColor="#64748b"
        />

        <Text style={styles.label}>Guest name</Text>
        <TextInput
          value={guestName}
          onChangeText={setGuestName}
          style={styles.input}
          placeholder="Guest full name"
          placeholderTextColor="#64748b"
        />

        <Text style={styles.label}>Guest contact number</Text>
        <TextInput
          keyboardType="phone-pad"
          value={guestContact}
          onChangeText={setGuestContact}
          style={styles.input}
          placeholder="Contact number"
          placeholderTextColor="#64748b"
        />

        <Text style={[styles.label, { marginTop: 8 }]}>Extra fields</Text>
        {extra.map((f, i) => (
          <View key={i} style={[styles.row, { marginBottom: 10 }]}>
            <TextInput
              value={f.key}
              onChangeText={(t) => updateField(i, 'key', t)}
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Key"
              placeholderTextColor="#64748b"
            />
            <TextInput
              value={f.value}
              onChangeText={(t) => updateField(i, 'value', t)}
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Value"
              placeholderTextColor="#64748b"
            />
            <Pressable style={styles.buttonSecondary} onPress={() => removeField(i)}>
              <Text style={styles.buttonTextSecondary}>Remove</Text>
            </Pressable>
          </View>
        ))}

        <View style={styles.row}>
          <Pressable style={styles.buttonSecondary} onPress={addField}>
            <Text style={styles.buttonTextSecondary}>Add field</Text>
          </Pressable>
        </View>

        {!!error && <Text style={[styles.error, { marginTop: 12 }]}>{error}</Text>}

        <View style={{ gap: 10, marginTop: 12 }}>
          <Pressable style={styles.buttonPrimary} onPress={onSubmit} disabled={loading}>
            <Text style={styles.buttonTextPrimary}>{loading ? 'Submitting…' : 'Submit invite'}</Text>
          </Pressable>
          <Pressable style={styles.buttonSecondary} onPress={() => router.push('/emergencies')}>
            <Text style={styles.buttonTextSecondary}>Go to Emergencies</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  )
}

