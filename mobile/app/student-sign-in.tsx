import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { studentSignIn } from '../src/api/endpoints'
import { setToken } from '../src/api/token'
import { styles } from '../src/ui/styles'

export default function StudentSignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      const data = await studentSignIn({ email, password })
      if (data.valid) {
        if (data.token) await setToken(data.token)
        router.replace('/invite')
      } else {
        setError(data.error ?? 'Login failed')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Student Sign In</Text>
        <Text style={styles.subtitle}>Use your registered student credentials.</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#64748b"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="#64748b"
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.buttonPrimary} onPress={onSubmit} disabled={loading}>
          <Text style={styles.buttonTextPrimary}>{loading ? 'Signing in…' : 'Sign In'}</Text>
        </Pressable>
      </View>
    </View>
  )
}

