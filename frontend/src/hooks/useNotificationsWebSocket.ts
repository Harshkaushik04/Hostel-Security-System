/**
 * WebSocket for notifications (server on port 3000)
 */
import { useEffect, useRef, useState } from 'react'

const WS_URL = `ws://${import.meta.env.VITE_BACKEND_IP}:3000`

export function useNotificationsWebSocket() {
  const [messages, setMessages] = useState<unknown[]>([])
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null
      if (token) {
        ws.send(JSON.stringify({ type: 'notification-auth', token }))
      }
    }
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setConnected(false)
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setMessages((prev) => [data, ...prev])
      } catch {
        setMessages((prev) => [{ raw: event.data }, ...prev])
      }
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [])

  return { messages, connected }
}
