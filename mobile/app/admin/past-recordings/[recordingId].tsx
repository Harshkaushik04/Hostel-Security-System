import { Link, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { Linking, Pressable, ScrollView, Text, View } from 'react-native'
import { getPastRecording } from '../../../src/api/endpoints'
import { styles } from '../../../src/ui/styles'

export default function PastRecordingPlayer() {
  const { recordingId } = useLocalSearchParams<{ recordingId: string }>()
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!recordingId) return
    let cancelled = false
    getPastRecording({ id: decodeURIComponent(String(recordingId)) })
      .then((res) => {
        const url = (res as { url?: string })?.url ?? null
        if (!cancelled) setVideoUrl(url)
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
  }, [recordingId])

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.card}>
        <Link href="/admin/past-recordings" asChild>
          <Pressable style={[styles.buttonSecondary, { marginBottom: 12 }]}>
            <Text style={styles.buttonTextSecondary}>← Back to Past recordings</Text>
          </Pressable>
        </Link>

        <Text style={styles.title}>Past recording</Text>
        <Text style={styles.subtitle}>[express] POST /get-past-recording</Text>

        {loading && <Text style={styles.subtitle}>Loading…</Text>}
        {!!error && <Text style={styles.error}>{error}</Text>}

        {!loading && !error && (
          <View
            style={{
              borderRadius: 12,
              overflow: 'hidden',
              minHeight: 220,
              backgroundColor: '#000',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {videoUrl ? (
              <Pressable onPress={() => Linking.openURL(videoUrl)}>
                <Text style={[styles.subtitle, { color: '#38bdf8', textDecorationLine: 'underline' }]}>
                  Open video in browser
                </Text>
                <Text style={[styles.subtitle, { fontSize: 12 }]} numberOfLines={2}>
                  {videoUrl}
                </Text>
              </Pressable>
            ) : (
              <Text style={styles.subtitle}>No video URL from API</Text>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  )
}

