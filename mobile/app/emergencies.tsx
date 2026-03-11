import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { fetchEmergencies } from '../src/api/endpoints'
import { styles } from '../src/ui/styles'
import { router } from 'expo-router'

export default function Emergencies() {
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
        <Text style={styles.title}>Emergencies</Text>
        <Text style={styles.subtitle}>[express] GET /emergencies</Text>

        {loading && <Text style={styles.subtitle}>Loading…</Text>}
        {!!error && <Text style={styles.error}>{error}</Text>}

        {!loading && !error && data !== null && (
          <Text style={styles.code}>{JSON.stringify(data, null, 2)}</Text>
        )}

        <View style={{ gap: 10, marginTop: 16 }}>
          <Pressable style={styles.buttonSecondary} onPress={() => router.push('/invite')}>
            <Text style={styles.buttonTextSecondary}>Back to Visitor Entry</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  )
}

