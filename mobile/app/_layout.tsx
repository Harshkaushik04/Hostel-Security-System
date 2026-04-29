import { Stack, router, useSegments } from 'expo-router'
import { useEffect } from 'react'
import { getToken } from '../src/api/token'

export default function RootLayout() {
  const segments = useSegments()

  useEffect(() => {
    let alive = true

    const path = '/' + segments.join('/')
    const isPublic =
      path === '/' || path === '/admin-sign-in' || path === '/student-sign-in'

    if (isPublic) return

    ;(async () => {
      try {
        const token = await getToken()
        if (!alive) return
        if (token) return

        const isAdminRoute = segments[0] === 'admin'
        router.replace(isAdminRoute ? '/admin-sign-in' : '/student-sign-in')
      } catch {
        if (!alive) return
        const isAdminRoute = segments[0] === 'admin'
        router.replace(isAdminRoute ? '/admin-sign-in' : '/student-sign-in')
      }
    })()

    return () => {
      alive = false
    }
  }, [segments])

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

