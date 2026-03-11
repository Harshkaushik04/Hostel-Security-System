import { Stack } from 'expo-router'

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#e5e7eb',
        contentStyle: { backgroundColor: '#0b1220' },
      }}
    />
  )
}

