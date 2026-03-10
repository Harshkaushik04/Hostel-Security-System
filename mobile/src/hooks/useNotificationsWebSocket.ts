import { useEffect, useMemo, useState } from 'react'
import { getWsBase } from '../config'

export function useNotificationsWebSocket() {
  const url = useMemo(() => getWsBase(), [])
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<unknown[]>([])

  useEffect(() => {
    const ws = new WebSocket(url)

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setConnected(false)
    ws.onmessage = (evt) => {
      const raw = typeof evt.data === 'string' ? evt.data : ''
      try {
        const parsed = JSON.parse(raw)
        setMessages((prev) => [parsed, ...prev].slice(0, 200))
      } catch {
        setMessages((prev) => [raw, ...prev].slice(0, 200))
      }
    }

    return () => ws.close()
  }, [url])

  return { connected, messages }
}

