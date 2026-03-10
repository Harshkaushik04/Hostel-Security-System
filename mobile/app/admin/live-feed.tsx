import { Link } from 'expo-router'
import { useRef, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { styles, colors } from '../../src/ui/styles'

type ViewFilter = 'all' | 'hostel-a' | 'hostel-b' | 'other'

const CAMS = ['Camera 1', 'Camera 2', 'Camera 3', 'Camera 4']

export default function LiveFeed() {
  const [view, setView] = useState<ViewFilter>('all')
  const [fullscreenId, setFullscreenId] = useState<string | null>(null)
  const lastTapRef = useRef<Record<string, number>>({})

  const onTilePress = (id: string) => {
    const now = Date.now()
    const last = lastTapRef.current[id] ?? 0
    lastTapRef.current[id] = now
    if (now - last < 300) {
      setFullscreenId((prev) => (prev === id ? null : id))
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.card}>
        <Link href="/admin/live-feed-landing" asChild>
          <Pressable style={[styles.buttonSecondary, { marginBottom: 12 }]}>
            <Text style={styles.buttonTextSecondary}>← Back</Text>
          </Pressable>
        </Link>

        <Text style={styles.title}>Live feed</Text>
        <Text style={styles.subtitle}>
          Toggle view. Double-tap a video tile for fullscreen. (WebRTC wiring placeholder)
        </Text>

        <View style={[styles.row, { marginBottom: 12 }]}>
          {(['all', 'hostel-a', 'hostel-b', 'other'] as ViewFilter[]).map((v) => (
            <Pressable
              key={v}
              onPress={() => setView(v)}
              style={styles.buttonSecondary}
            >
              <Text style={styles.buttonTextSecondary}>{v === 'all' ? 'All view' : v}</Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.row, { marginBottom: 12 }]}>
          <Link href="/admin/notifications" asChild>
            <Pressable style={styles.buttonSecondary}>
              <Text style={styles.buttonTextSecondary}>View notifications</Text>
            </Pressable>
          </Link>
          <Link href="/admin/activities" asChild>
            <Pressable style={styles.buttonSecondary}>
              <Text style={styles.buttonTextSecondary}>View activities</Text>
            </Pressable>
          </Link>
          <Link href="/admin/past-recordings" asChild>
            <Pressable style={styles.buttonSecondary}>
              <Text style={styles.buttonTextSecondary}>View past recordings</Text>
            </Pressable>
          </Link>
        </View>

        <View style={{ gap: 12 }}>
          {CAMS.map((label, idx) => {
            const id = `cam-${idx}`
            const isFull = fullscreenId === id
            if (fullscreenId && !isFull) return null
            return (
              <Pressable
                key={id}
                onPress={() => onTilePress(id)}
                style={{
                  height: fullscreenId ? 360 : 180,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: 'rgba(0,0,0,0.45)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: colors.muted }}>
                  {label} ({view}) — double-tap fullscreen
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>
    </ScrollView>
  )
}

