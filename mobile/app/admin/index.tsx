import { Link, router } from 'expo-router'
import { Pressable, Text, View } from 'react-native'
import { clearToken } from '../../src/api/token'
import { styles } from '../../src/ui/styles'

export default function AdminLanding() {
  const logout = async () => {
    await clearToken()
    router.replace('/')
  }

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Admin Console</Text>
            <Text style={styles.subtitle}>Choose an option below.</Text>
          </View>
          <Pressable style={styles.buttonSecondary} onPress={logout}>
            <Text style={styles.buttonTextSecondary}>Logout</Text>
          </Pressable>
        </View>

        <View style={{ gap: 10 }}>
          <Link href="/admin/live-feed-landing" asChild>
            <Pressable style={styles.buttonPrimary}>
              <Text style={styles.buttonTextPrimary}>Live feed / recordings / activities</Text>
            </Pressable>
          </Link>
          <Link href="/admin/manage" asChild>
            <Pressable style={styles.buttonSecondary}>
              <Text style={styles.buttonTextSecondary}>Manage students / admin list</Text>
            </Pressable>
          </Link>
          <Link href="/admin/notifications" asChild>
            <Pressable style={styles.buttonSecondary}>
              <Text style={styles.buttonTextSecondary}>Notifications</Text>
            </Pressable>
          </Link>
          <Link href="/admin/emergencies" asChild>
            <Pressable style={styles.buttonSecondary}>
              <Text style={styles.buttonTextSecondary}>Emergencies</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  )
}

