import { Link } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { fetchEmergencies } from '../../src/api/endpoints'
import { styles } from '../../src/ui/styles'

export default function AdminEmergencies() {
  const [data, setData] = useState<unknown>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchEmergencies()
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.card}>
        <Link href="/admin" asChild>
          <Pressable style={[styles.buttonSecondary, { marginBottom: 12 }]}>
            <Text style={styles.buttonTextSecondary}>← Back to Admin</Text>
          </Pressable>
        </Link>

        <Text style={styles.title}>Emergencies</Text>
        <Text style={styles.subtitle}>Admin view. [express] GET /emergencies</Text>

        {loading && <Text style={styles.subtitle}>Loading…</Text>}
        {!!error && <Text style={styles.error}>{error}</Text>}

        {!loading && !error && data !== null && (
          <Text style={styles.code}>{JSON.stringify(data, null, 2)}</Text>
        )}
      </View>
    </ScrollView>
  )
}

