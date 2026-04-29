import { Link } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { styles } from '../../src/ui/styles'

export default function LiveFeedLanding() {
  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Link href="/admin" asChild>
          <Pressable style={StyleSheet.flatten([styles.buttonSecondary, { marginBottom: 12 }])}>
            <Text style={styles.buttonTextSecondary}>← Back to Admin</Text>
          </Pressable>
        </Link>

        <Text style={styles.title}>Live feed / recordings</Text>
        <Text style={styles.subtitle}>Choose an option below.</Text>

        <View style={{ gap: 10 }}>
          <Link href="/admin/live-feed" asChild>
            <Pressable style={styles.buttonPrimary}>
              <Text style={styles.buttonTextPrimary}>LIVE FEED</Text>
            </Pressable>
          </Link>
          <Link href="/admin/past-recordings" asChild>
            <Pressable style={styles.buttonSecondary}>
              <Text style={styles.buttonTextSecondary}>PAST RECORDINGS</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  )
}

