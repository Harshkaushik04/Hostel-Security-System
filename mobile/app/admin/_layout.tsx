import { Stack, router } from 'expo-router'
import { useEffect, useState } from 'react'
import { getToken } from '../../src/api/token'

export default function AdminLayout() {
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    let alive = true

    ;(async () => {
      try {
        const token = await getToken()
        if (!alive) return

        if (!token) {
          setAuthed(false)
          router.replace('/admin-sign-in')
          return
        }

        setAuthed(true)
      } catch {
        if (!alive) return
        setAuthed(false)
        router.replace('/admin-sign-in')
      }
    })()

    return () => {
      alive = false
    }
  }, [])

  // Prevent flashing protected screens on web deep-links.
  if (authed !== true) return null

  return <Stack />
}

