import { Link } from 'expo-router'
import { Pressable, Text, View } from 'react-native'
import { styles } from '../src/ui/styles'

export default function Landing() {
  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Hostel Security</Text>
        <Text style={styles.subtitle}>Secure access for students and administrators.</Text>

        <View style={{ gap: 10 }}>
          <Link href="/student-sign-in" asChild>
            <Pressable style={styles.buttonPrimary}>
              <Text style={styles.buttonTextPrimary}>Student login</Text>
            </Pressable>
          </Link>
          <Link href="/admin-sign-in" asChild>
            <Pressable style={styles.buttonSecondary}>
              <Text style={styles.buttonTextSecondary}>Admin login</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  )
}

