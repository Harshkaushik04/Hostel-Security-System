/**
 * WebSocket for notifications (server on port 5000)
 */
import { useEffect, useRef, useState } from 'react'

const WS_URL = 'ws://127.0.0.1:5000'

export function useNotificationsWebSocket() {
  const [messages, setMessages] = useState<unknown[]>([])
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
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
