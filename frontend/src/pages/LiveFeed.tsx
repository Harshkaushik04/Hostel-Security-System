import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Device } from 'mediasoup-client'
import { CustomSchemas, CustomTypes } from '@my-app/shared'
import { layout, card, secondaryButton, primaryButton, inputStyle } from '../styles/common'

type ViewFilter = 'all' | 'hostel-a' | 'hostel-b' | 'other'

type StreamItem = {
  id: string
  producerId: string
  label: string
  stream: MediaStream
}

const MIN_CAMERA_SLOTS = 1
const MAX_CAMERA_SLOTS = 64
const DEFAULT_CAMERA_SLOTS = 4

function clampCameraSlots(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_CAMERA_SLOTS
  return Math.min(MAX_CAMERA_SLOTS, Math.max(MIN_CAMERA_SLOTS, Math.round(n)))
}

export default function LiveFeed() {
  const [view, setView] = useState<ViewFilter>('all')
  const [fullscreenId, setFullscreenId] = useState<string | null>(null)
  const [streams, setStreams] = useState<StreamItem[]>([])
  
  /** How many camera tiles to show (camera1 … cameraN). */
  const [maxCameraSlots, setMaxCameraSlots] = useState(DEFAULT_CAMERA_SLOTS)
  const maxCameraSlotsRef = useRef(DEFAULT_CAMERA_SLOTS)
  
  const [focusCameraInput, setFocusCameraInput] = useState('')
  const [focusHint, setFocusHint] = useState('')
  const [connected, setConnected] = useState(false)
  const [buttonPressed, setButtonPressed] = useState(false)
  const [error, setError] = useState('')
  
  const sfuWsRef = useRef<WebSocket | null>(null)
  const deviceRef = useRef<Device | null>(null)
  const recvTransportRef = useRef<any>(null)
  const videoRefsRef = useRef<Map<string, HTMLVideoElement>>(new Map())
  const deviceLoadedRef = useRef(false)

  useEffect(() => {
    maxCameraSlotsRef.current = maxCameraSlots
  }, [maxCameraSlots])

  /** If user reduces slots below the currently focused camera, exit focus. */
  useEffect(() => {
    if (!fullscreenId) return
    if (fullscreenId.startsWith('cam-')) {
      const n = Number(fullscreenId.slice(4))
      if (Number.isFinite(n) && n > maxCameraSlots) {
        setFullscreenId(null)
        setFocusHint(`Cleared focus: only ${maxCameraSlots} slot(s) configured.`)
      }
    } else if (fullscreenId.startsWith('placeholder-')) {
      const idx = Number(fullscreenId.slice('placeholder-'.length))
      if (Number.isFinite(idx) && idx >= maxCameraSlots) {
        setFullscreenId(null)
        setFocusHint(`Cleared focus: only ${maxCameraSlots} slot(s) configured.`)
      }
    }
  }, [maxCameraSlots, fullscreenId])

  const attachStream = useCallback((id: string, stream: MediaStream) => {
    const video = videoRefsRef.current.get(id)
    if (video && stream) {
      video.srcObject = stream
      video.play().catch(() => {})
    }
  }, [])

  useEffect(() => {
    const sfuHost = "localhost"
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

          const withinUiLimit =
            Number.isFinite(cameraNumber) &&
            cameraNumber >= 1 &&
            cameraNumber <= maxCameraSlotsRef.current

          if (withinUiLimit) {
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
          } else {
            // Still resume consumers we don't show, so SFU doesn't leave them paused forever.
            window.setTimeout(() => {
              const send_message: CustomTypes.sfu.consumerResumeToBackendType = {
                type: 'consumer-resume',
                cameraName,
              }
              ws.send(JSON.stringify(send_message))
            }, 50)
          }
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

  const applyFocusCamera = () => {
    setFocusHint('')
    const n = parseInt(focusCameraInput.trim(), 10)
    if (!Number.isFinite(n) || n < MIN_CAMERA_SLOTS || n > maxCameraSlots) {
      setFocusHint(`Enter a number between ${MIN_CAMERA_SLOTS} and ${maxCameraSlots}.`)
      return
    }
    const camId = `cam-${n}`
    const hasStream = streams.some((s) => s.id === camId)
    if (hasStream) {
      setFullscreenId(camId)
      return
    }
    if (streams.length === 0) {
      setFullscreenId(`placeholder-${n - 1}`)
      return
    }
    setFocusHint(`Camera ${n} has no stream yet.`)
  }

  const visibleStreams = streams.filter((s) => {
    const n = Number(s.id.replace(/^cam-/, ''))
    return Number.isFinite(n) && n >= 1 && n <= maxCameraSlots
  })

  const displayStreams = visibleStreams.length > 0 ? visibleStreams : []
  const placeholders =
    streams.length === 0
      ? Array.from({ length: maxCameraSlots }, (_, i) => `Camera ${i + 1}`)
      : []

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

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'center',
            marginBottom: '0.75rem',
          }}
        >
          <label style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Number of camera slots</label>
          <input
            type="number"
            min={MIN_CAMERA_SLOTS}
            max={MAX_CAMERA_SLOTS}
            value={maxCameraSlots}
            onChange={(e) => setMaxCameraSlots(clampCameraSlots(Number(e.target.value)))}
            style={{ ...inputStyle, width: 80 }}
            title="How many cameras to show (camera1 … cameraN)"
          />
          <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
            Showing slots 1–{maxCameraSlots} (matches SFU paths camera1 … camera{maxCameraSlots})
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <label style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Focus camera #</label>
          <input
            type="number"
            min={MIN_CAMERA_SLOTS}
            max={maxCameraSlots}
            value={focusCameraInput}
            onChange={(e) => setFocusCameraInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyFocusCamera()
            }}
            placeholder="e.g. 3"
            style={{ ...inputStyle, width: 88 }}
          />
          <button type="button" style={primaryButton} onClick={applyFocusCamera}>
            Focus
          </button>
          {fullscreenId && (
            <button
              type="button"
              style={secondaryButton}
              onClick={() => {
                setFullscreenId(null)
                setFocusHint('')
              }}
            >
              Exit focus
            </button>
          )}
          {focusHint && <span style={{ color: '#fbbf24', fontSize: '0.85rem' }}>{focusHint}</span>}
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

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: fullscreenId
              ? '1fr'
              : 'repeat(auto-fill, minmax(200px, 1fr))',
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
                <span style={{ color: '#9ca3af' }}>{label} </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}