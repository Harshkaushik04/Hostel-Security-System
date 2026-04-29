import { Link, router } from 'expo-router'
import { Image, Pressable, Text, View } from 'react-native'
import { clearToken } from '../../src/api/token'
import { styles } from '../../src/ui/styles'

export default function AdminLanding() {
  const logout = async () => {
    await clearToken()
    router.replace('/')
  }

  return (
    <View style={styles.screenCentered}>
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Admin Console</Text>
            <Text style={styles.subtitle}></Text>
          </View>
          <Pressable style={styles.buttonSecondary} onPress={logout}>
            <Text style={styles.buttonTextSecondary}>LOGOUT</Text>
          </Pressable>
        </View>

        <View style={styles.logoWrap}>
          <View style={[styles.logoCircle, { width: 170, height: 170, borderRadius: 85 }]}>
            <Image source={require('../../assets/icon.png')} style={[styles.logoImage, { width: 140, height: 140 }]} />
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <Link href="/admin/live-feed-landing" asChild>
            <Pressable style={styles.buttonPrimary}>
              <Text style={styles.buttonTextPrimary}>LIVE FEED / RECORDINGS</Text>
            </Pressable>
          </Link>
          <Link href="/admin/manage" asChild>
            <Pressable style={styles.buttonSecondary}>
              <Text style={styles.buttonTextSecondary}>MANAGE STUDENTS / ADMIN</Text>
            </Pressable>
          </Link>
          <Link href="/admin/notifications" asChild>
            <Pressable style={styles.buttonSecondary}>
              <Text style={styles.buttonTextSecondary}>NOTIFICATIONS</Text>
            </Pressable>
          </Link>
          <Link href="/admin/emergencies" asChild>
            <Pressable style={styles.buttonSecondary}>
              <Text style={styles.buttonTextSecondary}>EMERGENCIES</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  )
}

