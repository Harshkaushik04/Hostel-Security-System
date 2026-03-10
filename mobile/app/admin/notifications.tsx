import { Link } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { fetchPreviousNotifications } from '../../src/api/endpoints'
import { useNotificationsWebSocket } from '../../src/hooks/useNotificationsWebSocket'
import { styles } from '../../src/ui/styles'

export default function Notifications() {
  const { connected, messages } = useNotificationsWebSocket()
  const [previous, setPrevious] = useState<unknown[]>([])
  const [k, setK] = useState('20')
  const [loading, setLoading] = useState(false)

  const loadPrevious = async () => {
    setLoading(true)
    try {
      const res = await fetchPreviousNotifications({ k: Number(k) || 20 })
      const list = Array.isArray(res)
        ? (res as unknown[])
        : (res as { notifications?: unknown[] })?.notifications ?? []
      setPrevious(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPrevious()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const all = [...messages, ...previous]

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.card}>
        <Link href="/admin" asChild>
          <Pressable style={[styles.buttonSecondary, { marginBottom: 12 }]}>
            <Text style={styles.buttonTextSecondary}>← Back to Admin</Text>
          </Pressable>
        </Link>

        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>
          People entering (own or visitor). WebSocket (port 5000) + [express] /fetch-previous-notifications.
        </Text>

        <Text style={styles.label}>
          WebSocket:{' '}
          <Text style={{ color: connected ? '#4ade80' : '#f87171' }}>
            {connected ? 'Connected' : 'Disconnected'}
          </Text>
        </Text>

        <View style={[styles.row, { marginBottom: 12 }]}>
          <TextInput
            style={[styles.input, { width: 80, marginBottom: 0 }]}
            keyboardType="numeric"
            value={k}
            onChangeText={setK}
          />
          <Pressable style={styles.buttonSecondary} onPress={loadPrevious} disabled={loading}>
            <Text style={styles.buttonTextSecondary}>
              {loading ? 'Fetching…' : 'Fetch previous k'}
            </Text>
          </Pressable>
        </View>

        <View style={{ gap: 8 }}>
          {all.length === 0 && !loading && (
            <Text style={styles.subtitle}>No notifications yet.</Text>
          )}
          {all.map((msg, i) => (
            <View key={i} style={styles.buttonSecondary}>
              <Text style={styles.code}>{JSON.stringify(msg, null, 2)}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  )
}

