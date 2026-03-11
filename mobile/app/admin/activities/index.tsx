import { Link, router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { fetchRecentActivities, fetchTimerangeActivities } from '../../../src/api/endpoints'
import { styles } from '../../../src/ui/styles'

type ActivityItem = { id?: string; title?: string; thumbnail?: string; [k: string]: unknown }

export default function ActivitiesLanding() {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [recent, setRecent] = useState<ActivityItem[]>([])
  const [rangeResult, setRangeResult] = useState<ActivityItem[] | null>(null)
  const [loadingRecent, setLoadingRecent] = useState(true)
  const [loadingRange, setLoadingRange] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchRecentActivities({})
      .then((res) => {
        const list = Array.isArray(res) ? (res as ActivityItem[]) : (res as { activities?: ActivityItem[] })?.activities ?? []
        if (!cancelled) setRecent(list)
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load recent')
      })
      .finally(() => {
        if (!cancelled) setLoadingRecent(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const fetchRange = async () => {
    setError('')
    setLoadingRange(true)
    try {
      const res = await fetchTimerangeActivities({ start, end })
      const list = Array.isArray(res) ? (res as ActivityItem[]) : (res as { activities?: ActivityItem[] })?.activities ?? []
      setRangeResult(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
      setRangeResult([])
    } finally {
      setLoadingRange(false)
    }
  }

  const list = rangeResult !== null ? rangeResult : recent

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.card}>
        <Link href="/admin/live-feed-landing" asChild>
          <Pressable style={[styles.buttonSecondary, { marginBottom: 12 }]}>
            <Text style={styles.buttonTextSecondary}>← Back</Text>
          </Pressable>
        </Link>

        <Text style={styles.title}>Activities</Text>
        <Text style={styles.subtitle}>[express] /fetch-recent-activities, /fetch-timerange-activities</Text>

        <Text style={styles.label}>Start (date/time)</Text>
        <TextInput
          value={start}
          onChangeText={setStart}
          style={styles.input}
          placeholder="YYYY-MM-DDTHH:mm"
          placeholderTextColor="#64748b"
        />
        <Text style={styles.label}>End (date/time)</Text>
        <TextInput
          value={end}
          onChangeText={setEnd}
          style={styles.input}
          placeholder="YYYY-MM-DDTHH:mm"
          placeholderTextColor="#64748b"
        />

        <View style={[styles.row, { marginBottom: 12 }]}>
          <Pressable style={styles.buttonPrimary} onPress={fetchRange} disabled={loadingRange}>
            <Text style={styles.buttonTextPrimary}>{loadingRange ? 'Fetching…' : 'Fetch time range'}</Text>
          </Pressable>
          <Pressable style={styles.buttonSecondary} onPress={() => { setRangeResult(null); setError('') }}>
            <Text style={styles.buttonTextSecondary}>Show recent</Text>
          </Pressable>
        </View>

        {!!error && <Text style={styles.error}>{error}</Text>}
        {loadingRecent && rangeResult === null && <Text style={styles.subtitle}>Loading recent…</Text>}

        <View style={{ gap: 10 }}>
          {list.map((item, i) => {
            const id = String(item.id ?? i)
            return (
              <Pressable
                key={id}
                style={styles.buttonSecondary}
                onPress={() =>
                  router.push({
                    pathname: '/admin/activities/[activityId]',
                    params: { activityId: encodeURIComponent(id) },
                  })
                }
              >
                <Text style={styles.buttonTextSecondary}>{String(item.title ?? `Activity ${i + 1}`)}</Text>
              </Pressable>
            )
          })}
        </View>
      </View>
    </ScrollView>
  )
}

