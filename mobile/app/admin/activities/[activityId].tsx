import { Link, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { Linking, Pressable, ScrollView, Text, View } from 'react-native'
import { getActivity } from '../../../src/api/endpoints'
import { styles } from '../../../src/ui/styles'

export default function ActivityPlayer() {
  const { activityId } = useLocalSearchParams<{ activityId: string }>()
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!activityId) return
    let cancelled = false
    getActivity({ id: decodeURIComponent(String(activityId)) })
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
  }, [activityId])

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.card}>
        <Link href="/admin/activities" asChild>
          <Pressable style={[styles.buttonSecondary, { marginBottom: 12 }]}>
            <Text style={styles.buttonTextSecondary}>← Back to Activities</Text>
          </Pressable>
        </Link>

        <Text style={styles.title}>Activity video</Text>
        <Text style={styles.subtitle}>[express] POST /get-activity</Text>

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
              <Text style={styles.subtitle}>No video URL returned from API</Text>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  )
}

