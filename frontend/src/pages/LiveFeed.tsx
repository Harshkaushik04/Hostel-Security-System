import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { io } from 'socket.io-client'
import { Device } from 'mediasoup-client'
import type { Transport } from 'mediasoup-client/lib/Transport'
import type { Consumer } from 'mediasoup-client/lib/Consumer'
import { layout, card, secondaryButton, primaryButton } from '../styles/common'
import { API_BASE } from '../api/client'

const MEDIA_SERVER = 'http://127.0.0.1:4000'

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

function createDummyCanvasStream(label: string, index: number): MediaStream {
  const canvas = document.createElement('canvas')
  canvas.width = 640
  canvas.height = 480
  const ctx = canvas.getContext('2d')!
  const colors = ['#1e3a5f', '#2d5a3d', '#5a2d4a', '#5a4a2d']
  const color = colors[index % colors.length]
  let frame = 0
  function draw() {
    ctx.fillStyle = color
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#fff'
    ctx.font = '24px sans-serif'
    ctx.fillText(label, 20, 40)
    ctx.fillText(`Frame ${frame++}`, 20, 80)
    const now = new Date().toLocaleTimeString()
    ctx.fillText(now, 20, 120)
  }
  draw()
  const stream = canvas.captureStream(10)
  setInterval(draw, 100)
  return stream
}

export default function LiveFeed() {
  const [view, setView] = useState<ViewFilter>('all')
  const [fullscreenId, setFullscreenId] = useState<string | null>(null)
  const [streams, setStreams] = useState<StreamItem[]>([])
  const [broadcasting, setBroadcasting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState('')
  const [faceEvents, setFaceEvents] = useState<FaceDetectionEvent[]>([])
  const [faceStreamStatus, setFaceStreamStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')
  const socketRef = useRef<ReturnType<typeof io> | null>(null)
  const deviceRef = useRef<Device | null>(null)
  const sendTransportRef = useRef<Transport | null>(null)
  const recvTransportRef = useRef<Transport | null>(null)
  const consumersRef = useRef<Map<string, Consumer>>(new Map())
  const videoRefsRef = useRef<Map<string, HTMLVideoElement>>(new Map())

  const attachStream = useCallback((id: string, stream: MediaStream) => {
    const video = videoRefsRef.current.get(id)
    if (video && stream) {
      video.srcObject = stream
      video.play().catch(() => {})
    }
  }, [])

  useEffect(() => {
    const socket = io(MEDIA_SERVER)
    socketRef.current = socket
    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('connect_error', (e) => setError(e.message))

    const run = async () => {
      try {
        const { rtpCapabilities } = await new Promise<{ rtpCapabilities?: unknown }>((res, rej) => {
          socket.emit('getRouterRtpCapabilities', null, (r: unknown) => {
            if (r && typeof r === 'object' && 'error' in r) rej(new Error((r as { error: string }).error))
            else res(r as { rtpCapabilities: unknown })
          })
        })
        if (!rtpCapabilities) throw new Error('No RTP capabilities')

        const device = new Device()
        await device.load({ routerRtpCapabilities: rtpCapabilities })
        deviceRef.current = device

        const { id, iceParameters, iceCandidates, dtlsParameters } = await new Promise<{
          id: string
          iceParameters: unknown
          iceCandidates: unknown[]
          dtlsParameters: unknown
        }>((res, rej) => {
          socket.emit('createRecvTransport', null, (r: unknown) => {
            if (r && typeof r === 'object' && 'error' in r) rej(new Error((r as { error: string }).error))
            else res(r as { id: string; iceParameters: unknown; iceCandidates: unknown[]; dtlsParameters: unknown })
          })
        })

        const recvTransport = device.createRecvTransport({
          id,
          iceParameters,
          iceCandidates,
          dtlsParameters,
        })
        recvTransportRef.current = recvTransport

        recvTransport.on('connect', async ({ dtlsParameters }, callback) => {
          socket.emit('connectRecvTransport', { transportId: recvTransport.id, dtlsParameters }, (r: unknown) => {
            if (r && typeof r === 'object' && 'error' in r) callback(new Error((r as { error: string }).error))
            else callback()
          })
        })

        const pollProducers = async () => {
          const { producerIds } = await new Promise<{ producerIds: string[] }>((res) => {
            socket.emit('getProducers', null, (r: { producerIds?: string[] }) => res(r || { producerIds: [] }))
          })
          const rtpCap = device.rtpCapabilities
          for (const producerId of producerIds) {
            if (consumersRef.current.has(producerId)) continue
            try {
              const cons = await new Promise<{
                id: string
                producerId: string
                kind: string
                rtpParameters: unknown
              }>((res, rej) => {
                socket.emit(
                  'consume',
                  { transportId: recvTransport.id, producerId, rtpCapabilities: rtpCap },
                  (r: unknown) => {
                    if (r && typeof r === 'object' && 'error' in r) rej(new Error((r as { error: string }).error))
                    else res(r as { id: string; producerId: string; kind: string; rtpParameters: unknown })
                  }
                )
              })
              const consumer = await recvTransport.consume({
                id: cons.id,
                producerId: cons.producerId,
                kind: cons.kind as 'video' | 'audio',
                rtpParameters: cons.rtpParameters,
              })
              consumersRef.current.set(producerId, consumer)
              const stream = new MediaStream([consumer.track])
              setStreams((prev) => {
                const item: StreamItem = {
                  id: `stream-${producerId}`,
                  producerId,
                  label: `Camera ${prev.length + 1}`,
                  stream,
                }
                setTimeout(() => attachStream(item.id, stream), 0)
                return [...prev, item]
              })
            } catch (e) {
              console.warn('consume failed', producerId, e)
            }
          }
        }

        await pollProducers()
        const interval = setInterval(pollProducers, 2000)
        socket.on('newProducer', ({ producerId }: { producerId: string }) => {
          pollProducers()
        })
        return () => clearInterval(interval)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to connect')
      }
    }
    run()

    return () => {
      socket.off('newProducer')
      socket.disconnect()
      socketRef.current = null
      recvTransportRef.current?.close()
      deviceRef.current = null
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

  const startDummyStreams = async () => {
    if (!deviceRef.current || !socketRef.current || broadcasting) return
    setError('')
    setBroadcasting(true)
    try {
      const device = deviceRef.current
      const socket = socketRef.current

      const { id, iceParameters, iceCandidates, dtlsParameters } = await new Promise<{
        id: string
        iceParameters: unknown
        iceCandidates: unknown[]
        dtlsParameters: unknown
      }>((res, rej) => {
        socket.emit('createSendTransport', null, (r: unknown) => {
          if (r && typeof r === 'object' && 'error' in r) rej(new Error((r as { error: string }).error))
          else res(r as { id: string; iceParameters: unknown; iceCandidates: unknown[]; dtlsParameters: unknown })
        })
      })

      const sendTransport = device.createSendTransport({
        id,
        iceParameters,
        iceCandidates,
        dtlsParameters,
      })
      sendTransportRef.current = sendTransport

      sendTransport.on('connect', async ({ dtlsParameters }, callback) => {
        socket.emit('connectSendTransport', { transportId: sendTransport.id, dtlsParameters }, (r: unknown) => {
          if (r && typeof r === 'object' && 'error' in r) callback(new Error((r as { error: string }).error))
          else callback()
        })
      })

      sendTransport.on('produce', async ({ kind, rtpParameters, appData }, callback) => {
        socket.emit('produce', { transportId: sendTransport.id, kind, rtpParameters, appData }, (r: unknown) => {
          if (r && typeof r === 'object' && 'error' in r) callback(new Error((r as { error: string }).error))
          else callback({ id: (r as { id: string }).id })
        })
      })

      const labels = ['Hostel A - Cam 1', 'Hostel A - Cam 2', 'Hostel B - Cam 1', 'Hostel B - Cam 2']
      for (let i = 0; i < 4; i++) {
        const stream = createDummyCanvasStream(labels[i], i)
        const track = stream.getVideoTracks()[0]
        await sendTransport.produce({ track, appData: { source: `dummy-${i}` } })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start streams')
    } finally {
      setBroadcasting(false)
    }
  }

  const toggleFullscreen = (id: string) => {
    setFullscreenId((prev) => (prev === id ? null : id))
  }

  const displayStreams = streams.length > 0 ? streams : []
  const placeholders = streams.length === 0 ? ['Camera 1', 'Camera 2', 'Camera 3', 'Camera 4'] : []
  const latestFace = faceEvents[0]

  return (
    <div style={layout}>
      <div style={card}>
        <Link to="/admin/live-feed-landing" style={{ ...secondaryButton, textDecoration: 'none' }}>← Back</Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>Live feed</h1>
        <p style={{ fontSize: '1rem', color: '#9ca3af', marginBottom: '1rem' }}>
          WebRTC streams via SFU. Start dummy streams, then view below. Double-click for fullscreen.
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: connected ? '#4ade80' : '#f87171', fontSize: '0.9rem' }}>
            Media server: {connected ? 'Connected' : 'Disconnected'}
          </span>
          <button
            type="button"
            style={primaryButton}
            onClick={startDummyStreams}
            disabled={!connected || broadcasting}
          >
            {broadcasting ? 'Starting…' : 'Start dummy streams'}
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
                  <span style={{ color: '#9ca3af' }}>{label} (start dummy streams to view)</span>
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
                    Stream:{' '}
                    {faceStreamStatus === 'connected'
                      ? 'Connected'
                      : faceStreamStatus === 'connecting'
                        ? 'Connecting…'
                        : 'Error'}
                  </div>
                </div>
                <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>{faceEvents.length} events</div>
              </div>

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
