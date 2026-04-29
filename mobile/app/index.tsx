import { Link } from 'expo-router'
import { Image, Pressable, Text, View } from 'react-native'
import { styles } from '../src/ui/styles'

export default function Landing() {
  return (
    <View style={styles.screenCentered}>
      <View style={styles.card}>
        <Text style={styles.brandMark}>HOSTEL SECURITY</Text>
        <Text style={styles.heroTitle}>
          Safe Access{'\n'}Simple Control
        </Text>
        <Text style={styles.heroText}>Log in to continue.</Text>

        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Image source={require('../assets/icon.png')} style={styles.logoImage} />
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <Link href="/student-sign-in" asChild>
            <Pressable style={styles.buttonPrimary}>
              <Text style={styles.buttonTextPrimary}>STUDENT LOGIN</Text>
            </Pressable>
          </Link>
          <Link href="/admin-sign-in" asChild>
            <Pressable style={styles.buttonSecondary}>
              <Text style={styles.buttonTextSecondary}>ADMIN LOGIN</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  )
}

