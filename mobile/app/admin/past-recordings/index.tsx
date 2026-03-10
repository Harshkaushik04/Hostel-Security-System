import { Link, router } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { styles } from '../../../src/ui/styles'

type RecordingItem = { id: string; title: string; start?: string; end?: string }

export default function PastRecordingsLanding() {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [recordings, setRecordings] = useState<RecordingItem[]>([])
  const [loading, setLoading] = useState(false)

  const fetchRange = () => {
    setLoading(true)
    setTimeout(() => {
      setRecordings([{ id: '1', title: 'Recording 1', start: start || undefined, end: end || undefined }])
      setLoading(false)
    }, 400)
  }

  const fetchLast24 = () => {
    setLoading(true)
    setTimeout(() => {
      setRecordings([{ id: '24h-1', title: 'Last 24h recording' }])
      setLoading(false)
    }, 400)
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.card}>
        <Link href="/admin/live-feed-landing" asChild>
          <Pressable style={[styles.buttonSecondary, { marginBottom: 12 }]}>
            <Text style={styles.buttonTextSecondary}>← Back</Text>
          </Pressable>
        </Link>

        <Text style={styles.title}>Past recordings</Text>
        <Text style={styles.subtitle}>Date filter + last 24h option.</Text>

        <Text style={styles.label}>Start</Text>
        <TextInput
          value={start}
          onChangeText={setStart}
          style={styles.input}
          placeholder="YYYY-MM-DDTHH:mm"
          placeholderTextColor="#64748b"
        />
        <Text style={styles.label}>End</Text>
        <TextInput
          value={end}
          onChangeText={setEnd}
          style={styles.input}
          placeholder="YYYY-MM-DDTHH:mm"
          placeholderTextColor="#64748b"
        />

        <View style={[styles.row, { marginBottom: 12 }]}>
          <Pressable style={styles.buttonPrimary} onPress={fetchRange} disabled={loading}>
            <Text style={styles.buttonTextPrimary}>{loading ? 'Fetching…' : 'Fetch time range'}</Text>
          </Pressable>
          <Pressable style={styles.buttonSecondary} onPress={fetchLast24} disabled={loading}>
            <Text style={styles.buttonTextSecondary}>Last 24h</Text>
          </Pressable>
        </View>

        <View style={{ gap: 10 }}>
          {recordings.map((r) => (
            <Pressable
              key={r.id}
              style={styles.buttonSecondary}
              onPress={() =>
                router.push({ pathname: '/admin/past-recordings/[recordingId]', params: { recordingId: encodeURIComponent(r.id) } })
              }
            >
              <Text style={styles.buttonTextSecondary}>{r.title}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  )
}

