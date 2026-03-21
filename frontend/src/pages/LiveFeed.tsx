import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Device } from 'mediasoup-client'
import { CustomSchemas, CustomTypes } from '@my-app/shared'
import { layout, card, secondaryButton, primaryButton } from '../styles/common'
import { API_BASE } from '../api/client'

type ViewFilter = 'all' | 'hostel-a' | 'hostel-b' | 'other'

type StreamItem = {
  id: string
  producerId: string
  label: string
  stream: MediaStream
}

type FaceDetectionEvent = {
  cameraId: string
  ts: number
  bboxes: Array<{ x: number; y: number; w: number; h: number }>
  frameJpegBase64?: string
}

type FaceWsMessage =
  | { type: 'face_detected'; name: string; score?: number; ts: number; message?: string }
  | { type: string; [k: string]: unknown }

export default function LiveFeed() {
  const [view, setView] = useState<ViewFilter>('all')
  const [fullscreenId, setFullscreenId] = useState<string | null>(null)
  const [streams, setStreams] = useState<StreamItem[]>([])
  const [connected, setConnected] = useState(false)
  const [buttonPressed, setButtonPressed] = useState(false)
  const [error, setError] = useState('')
  const [faceEvents, setFaceEvents] = useState<FaceDetectionEvent[]>([])
  const [faceStreamStatus, setFaceStreamStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')
  const [faceWsStatus, setFaceWsStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')
  const [faceWsMessages, setFaceWsMessages] = useState<FaceWsMessage[]>([])
  const sfuWsRef = useRef<WebSocket | null>(null)
  const deviceRef = useRef<Device | null>(null)
  const recvTransportRef = useRef<any>(null)
  const videoRefsRef = useRef<Map<string, HTMLVideoElement>>(new Map())
  const deviceLoadedRef = useRef(false)

  const attachStream = useCallback((id: string, stream: MediaStream) => {
    const video = videoRefsRef.current.get(id)
    if (video && stream) {
      video.srcObject = stream
      video.play().catch(() => {})
    }
  }, [])

  useEffect(() => {
    const host = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1'
    const sfuHost = host === 'localhost' ? '127.0.0.1' : host
    const wsUrl = `ws://${sfuHost}:2000`

    const ws = new WebSocket(wsUrl)
    sfuWsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = () => {
      setConnected(false)
      setButtonPressed(false)
    }
    ws.onerror = () => {
      setError('Failed to connect to SFU')
      setConnected(false)
    }

    ws.onmessage = async (evt) => {
      try {
        const recv_message: unknown = JSON.parse(String(evt.data))
        const whetherCorrect = CustomSchemas.sfu.wsMessageToFrontendSchema.safeParse(recv_message)
        if (!whetherCorrect.success) {
          const err_message: CustomTypes.sfu.errMessageType = {
            type: 'error',
            error: 'message recieved from server not matching wsMessageToFrontendSchema',
          }
          ws.send(JSON.stringify(err_message))
          return
        }

        const json_message: CustomTypes.sfu.wsMessageToFrontendType = whetherCorrect.data

        if (json_message.type === 'get-rtp-capabilities') {
          setError('')
          if (!deviceRef.current) deviceRef.current = new Device()
          const device = deviceRef.current

          if (!deviceLoadedRef.current) {
            await device.load({ routerRtpCapabilities: json_message.rtpCapabilities as any })
            deviceLoadedRef.current = true
          }

          const send_message: CustomTypes.sfu.createWebrtcTransportToBackendType = {
            type: 'create-webrtc-transport',
          }
          ws.send(JSON.stringify(send_message))
        } else if (json_message.type === 'send-consumer-transport-params') {
          if (!deviceRef.current) return
          const params = json_message.params as any
          const device = deviceRef.current

          const transport = device.createRecvTransport(params)
          recvTransportRef.current = transport

          transport.on('connect', ({ dtlsParameters }: any, callback: () => void, errback: (e: Error) => void) => {
            try {
              const send_message: CustomTypes.sfu.transportRecvConnectToBackendType = {
                type: 'transport-recv-connect',
                transportId: transport.id,
                dtlsParameters,
              }
              ws.send(JSON.stringify(send_message))
              callback()
            } catch (e) {
              errback(e as Error)
            }
          })

          const send_message: CustomTypes.sfu.sendDeviceRtpCapabilitiesToBackendType = {
            type: 'send-device-rtp-capabilities',
            rtpCapabilities: device.recvRtpCapabilities,
          }
          ws.send(JSON.stringify(send_message))
        } else if (json_message.type === 'invitation-to-consume') {
          const { cameraName, producerId } = json_message.params
          const cameraNumber = Number(cameraName.slice(6))

          if (!recvTransportRef.current) return
          const consumerTransport = recvTransportRef.current

          const cons = await consumerTransport.consume(json_message.params as any)

          const withinUiLimit = Number.isFinite(cameraNumber) && cameraNumber >= 1 && cameraNumber <= 4
          if (!withinUiLimit) return

          const itemId = `cam-${cameraNumber}`
          const stream = new MediaStream([cons.track])

          setStreams((prev) => {
            if (prev.some((p) => p.id === itemId)) return prev
            const item: StreamItem = {
              id: itemId,
              producerId,
              label: `Camera ${cameraNumber}`,
              stream,
            }
            return [...prev, item]
          })

          window.setTimeout(() => {
            attachStream(itemId, stream)
            const send_message: CustomTypes.sfu.consumerResumeToBackendType = {
              type: 'consumer-resume',
              cameraName,
            }
            ws.send(JSON.stringify(send_message))
          }, 50)
        } else if (json_message.type === 'error') {
          setError(json_message.error)
          setButtonPressed(false)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to handle SFU message')
        setButtonPressed(false)
      }
    }

    return () => {
      try {
        ws.close()
      } catch {
        // ignore
      }
      sfuWsRef.current = null
      recvTransportRef.current = null
      deviceRef.current = null
      deviceLoadedRef.current = false
    }
  }, [attachStream])

  useEffect(() => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null
    if (!token) {
      setFaceStreamStatus('error')
      return
    }
    setFaceStreamStatus('connecting')

    const url = `${API_BASE}/face-events/stream?token=${encodeURIComponent(token)}`
    const es = new EventSource(url)
    es.onopen = () => setFaceStreamStatus('connected')
    es.onerror = () => setFaceStreamStatus('error')
    es.onmessage = (msg) => {
      try {
        const ev = JSON.parse(msg.data) as FaceDetectionEvent
        setFaceEvents((prev) => [ev, ...prev].slice(0, 100))
      } catch {
        // ignore
      }
    }
    return () => es.close()
  }, [])

  useEffect(() => {
    // FastAPI face detection websocket (default port 8001)
    const host = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1'
    const wsUrl = `ws://${host}:8001/ws`
    setFaceWsStatus('connecting')

    const ws = new WebSocket(wsUrl)
    ws.onopen = () => setFaceWsStatus('connected')
    ws.onerror = () => setFaceWsStatus('error')
    ws.onclose = () => setFaceWsStatus('error')
    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(String(evt.data)) as FaceWsMessage
        setFaceWsMessages((prev) => [msg, ...prev].slice(0, 50))
      } catch {
        // ignore
      }
    }

    // keepalive ping every 15s
    const t = window.setInterval(() => {
      try {
        if (ws.readyState === WebSocket.OPEN) ws.send('ping')
      } catch {
        // ignore
      }
    }, 15000)

    return () => {
      window.clearInterval(t)
      ws.close()
    }
  }, [])

  const receiveVideos = () => {
    const ws = sfuWsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN || buttonPressed) return

    setError('')
    setButtonPressed(true)
    setStreams([])
    recvTransportRef.current = null
    deviceLoadedRef.current = false
    setFullscreenId(null)

    ws.send(JSON.stringify({ type: 'get-rtp-capabilities' }))
  }

  const toggleFullscreen = (id: string) => {
    setFullscreenId((prev) => (prev === id ? null : id))
  }

  const displayStreams = streams.length > 0 ? streams : []
  const placeholders = streams.length === 0 ? ['Camera 1', 'Camera 2', 'Camera 3', 'Camera 4'] : []
  const latestFace = faceEvents[0]
  const latestWs = faceWsMessages[0]

  return (
    <div style={layout}>
      <div style={card}>
        <Link to="/admin/live-feed-landing" style={{ ...secondaryButton, textDecoration: 'none' }}>← Back</Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>Live feed</h1>
        <p style={{ fontSize: '1rem', color: '#9ca3af', marginBottom: '1rem' }}>
          WebRTC streams via SFU. Click Receive video to connect, then view below. Double-click for fullscreen.
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: connected ? '#4ade80' : '#f87171', fontSize: '0.9rem' }}>
            Media server: {connected ? 'Connected' : 'Disconnected'}
          </span>
          <button
            type="button"
            style={primaryButton}
            onClick={receiveVideos}
            disabled={!connected || buttonPressed}
          >
            {buttonPressed ? 'Connecting…' : 'Receive video'}
          </button>
        </div>

        {error && <p style={{ color: '#f87171', marginBottom: '1rem' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {(['all', 'hostel-a', 'hostel-b', 'other'] as ViewFilter[]).map((v) => (
            <button
              key={v}
              type="button"
              style={{ ...secondaryButton, fontWeight: view === v ? 600 : 500 }}
              onClick={() => setView(v)}
            >
              {v === 'all' ? 'All view' : v}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <Link to="/admin/notifications" style={{ ...secondaryButton, textDecoration: 'none' }}>View notifications</Link>
          <Link to="/admin/activities" style={{ ...secondaryButton, textDecoration: 'none' }}>View activities</Link>
          <Link to="/admin/past-recordings" style={{ ...secondaryButton, textDecoration: 'none' }}>View past recordings</Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: fullscreenId ? '1fr' : '1fr 360px', gap: '1rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: fullscreenId ? '1fr' : 'repeat(2, 1fr)',
              gap: '1rem',
            }}
          >
            {displayStreams.map((item) => {
              const isFull = fullscreenId === item.id
              if (fullscreenId && !isFull) return null
              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onDoubleClick={() => toggleFullscreen(item.id)}
                  style={{
                    position: 'relative',
                    aspectRatio: '16/9',
                    background: '#000',
                    borderRadius: 8,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: '1px solid rgba(148,163,184,0.3)',
                  }}
                >
                  <video
                    ref={(el) => {
                      if (el) {
                        videoRefsRef.current.set(item.id, el)
                        el.srcObject = item.stream
                        el.play().catch(() => {})
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8,
                      background: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: '0.85rem',
                    }}
                  >
                    {item.label} — double-click fullscreen
                  </div>
                </div>
              )
            })}
            {placeholders.map((label, i) => {
              const id = `placeholder-${i}`
              const isFull = fullscreenId === id
              if (fullscreenId && !isFull) return null
              return (
                <div
                  key={id}
                  role="button"
                  tabIndex={0}
                  onDoubleClick={() => toggleFullscreen(id)}
                  style={{
                    aspectRatio: '16/9',
                    background: 'rgba(0,0,0,0.5)',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    border: '1px solid rgba(148,163,184,0.3)',
                  }}
                >
                  <span style={{ color: '#9ca3af' }}>{label} (click Receive video to view)</span>
                </div>
              )
            })}
          </div>

          {!fullscreenId && (
            <div
              style={{
                border: '1px solid rgba(148,163,184,0.25)',
                borderRadius: 10,
                padding: '0.9rem',
                background: 'rgba(15,23,42,0.35)',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>Detections</div>
                  <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                    SSE:{' '}
                    {faceStreamStatus === 'connected'
                      ? 'Connected'
                      : faceStreamStatus === 'connecting'
                        ? 'Connecting…'
                        : 'Error'}
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                    WS:{' '}
                    {faceWsStatus === 'connected'
                      ? 'Connected'
                      : faceWsStatus === 'connecting'
                        ? 'Connecting…'
                        : 'Error'}
                  </div>
                </div>
                <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>{faceEvents.length} events</div>
              </div>

              {latestWs?.type === 'face_detected' && (
                <div
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: 10,
                    border: '1px solid rgba(74, 222, 128, 0.25)',
                    background: 'rgba(22, 163, 74, 0.08)',
                  }}
                >
                  <div style={{ fontWeight: 700 }}>
                    {(latestWs as { message?: unknown }).message
                      ? String((latestWs as { message: unknown }).message)
                      : `${String((latestWs as { name?: unknown }).name ?? 'Unknown')}'s face has been detected`}
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                    {new Date(Number(latestWs.ts)).toLocaleTimeString()}
                    {typeof (latestWs as { score?: number }).score === 'number'
                      ? ` • score ${(latestWs as { score: number }).score.toFixed(3)}`
                      : null}
                  </div>
                </div>
              )}

              <div style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
                {latestFace?.frameJpegBase64 ? (
                  <img
                    alt="Latest detection frame"
                    src={`data:image/jpeg;base64,${latestFace.frameJpegBase64}`}
                    style={{
                      width: '100%',
                      borderRadius: 8,
                      border: '1px solid rgba(148,163,184,0.25)',
                      display: 'block',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      borderRadius: 8,
                      border: '1px dashed rgba(148,163,184,0.25)',
                      padding: '1rem',
                      color: '#9ca3af',
                      fontSize: '0.9rem',
                      textAlign: 'center',
                    }}
                  >
                    No snapshot yet
                  </div>
                )}
              </div>

              <div style={{ maxHeight: '420px', overflow: 'auto', display: 'grid', gap: '0.5rem' }}>
                {faceEvents.slice(0, 25).map((ev) => (
                  <div
                    key={`${ev.cameraId}-${ev.ts}`}
                    style={{
                      border: '1px solid rgba(148,163,184,0.2)',
                      borderRadius: 8,
                      padding: '0.6rem 0.65rem',
                      background: 'rgba(2,6,23,0.35)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                      <div style={{ fontWeight: 600 }}>{ev.cameraId}</div>
                      <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                        {new Date(ev.ts).toLocaleTimeString()}
                      </div>
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                      Faces: {ev.bboxes.length}
                    </div>
                  </div>
                ))}
                {faceEvents.length === 0 && (
                  <div style={{ color: '#9ca3af', fontSize: '0.95rem', padding: '0.5rem 0' }}>
                    Waiting for first detection…
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
