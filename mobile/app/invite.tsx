import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { invite, type InviteBody } from '../src/api/endpoints'
import { styles } from '../src/ui/styles'

export default function VisitorEntry() {
  const [hostEmail, setHostEmail] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestContact, setGuestContact] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async () => {
    setError('')
    setLoading(true)
    const body: InviteBody = {
      host_email: hostEmail,
      guest_name: guestName,
      guest_contact_number: guestContact,
    }
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
          Invite a guest by filling required fields.
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

