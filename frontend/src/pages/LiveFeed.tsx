import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Device } from 'mediasoup-client'
import { CustomSchemas, CustomTypes } from '@my-app/shared'
import { layout, card, secondaryButton, primaryButton, inputStyle } from '../styles/common'
import { getCamerasList } from '../api/endpoints'

type StreamItem = {
  id: string
  producerId: string
  label: string
  stream: MediaStream
  cameraName: string
}



export default function LiveFeed() {
  const [fullscreenId, setFullscreenId] = useState<string | null>(null)
  const [streams, setStreams] = useState<StreamItem[]>([])


  const [cameraMap, setCameraMap] = useState<Record<string, string>>({})
  const [focusCameraInput, setFocusCameraInput] = useState('')
  const [focusHint, setFocusHint] = useState('')

  useEffect(() => {
    getCamerasList().then((res) => {
      if ('cameras' in res && res.cameras) {
        const map: Record<string, string> = {}
        for (const cam of res.cameras) {
          map[cam.cameraName] = cam.hostelName
        }
        setCameraMap(map)
      }
    }).catch(() => {})
  }, [])
  const [connected, setConnected] = useState(false)
  const [buttonPressed, setButtonPressed] = useState(false)
  const [error, setError] = useState('')

  const sfuWsRef = useRef<WebSocket | null>(null)
  const deviceRef = useRef<Device | null>(null)
  const recvTransportRef = useRef<any>(null)
  const videoRefsRef = useRef<Map<string, HTMLVideoElement>>(new Map())
  const tileRefsRef = useRef<Map<string, HTMLDivElement>>(new Map())
  const deviceLoadedRef = useRef(false)



  const attachStream = useCallback((id: string, stream: MediaStream) => {
    const video = videoRefsRef.current.get(id)
    if (video && stream) {
      video.srcObject = stream
      video.play().catch(() => { })
    }
  }, [])

  useEffect(() => {
    const sfuHost = import.meta.env.VITE_SFU_HOST
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

          const token =
            typeof window !== 'undefined' ? window.localStorage.getItem('token') ?? '' : ''
          const send_message: CustomTypes.sfu.sendDeviceRtpCapabilitiesToBackendType = {
            type: 'send-device-rtp-capabilities',
            rtpCapabilities: device.recvRtpCapabilities,
            token,
          }
          ws.send(JSON.stringify(send_message))
        } else if (json_message.type === 'invitation-to-consume') {
          const { cameraName, producerId } = json_message.params
          const cameraNumber = Number(cameraName.slice(6))

          if (!recvTransportRef.current) return
          const consumerTransport = recvTransportRef.current

          const cons = await consumerTransport.consume(json_message.params as any)

          if (Number.isFinite(cameraNumber) && cameraNumber >= 1) {
            const itemId = `cam-${cameraNumber}`
            const stream = new MediaStream([cons.track])

            setStreams((prev) => {
              if (prev.some((p) => p.id === itemId)) return prev
              const item: StreamItem = {
                id: itemId,
                producerId,
                label: `Camera ${cameraNumber}`,
                stream,
                cameraName,
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

  /** True if browser fullscreen is active on this tile (or a node inside it, e.g. video). */
  const isNativeFullscreenForTile = (tile: HTMLElement | null) => {
    const fs = document.fullscreenElement
    if (!fs || !tile) return false
    return fs === tile || tile.contains(fs)
  }

  const exitNativeFullscreenIfNeeded = async (id: string) => {
    const tile = tileRefsRef.current.get(id)
    if (!tile || !isNativeFullscreenForTile(tile)) return false
    try {
      await document.exitFullscreen()
      return true
    } catch {
      return false
    }
  }

  /** In-page focus: double-click toggles. Browser fullscreen (Full screen button): double-click exits. */
  const handleStreamTileDoubleClick = async (id: string) => {
    if (await exitNativeFullscreenIfNeeded(id)) return
    toggleFullscreen(id)
  }

  const openNativeFullscreen = async (id: string) => {
    const tile = tileRefsRef.current.get(id)
    if (!tile) return
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
      await tile.requestFullscreen()
    } catch {
      setError('Fullscreen is blocked by browser settings.')
    }
  }

  const applyFocusCamera = () => {
    setFocusHint('')
    const n = parseInt(focusCameraInput.trim(), 10)
    if (!Number.isFinite(n) || n < 1) {
      setFocusHint(`Enter a valid camera number.`)
      return
    }
    const camId = `cam-${n}`
    const hasStream = streams.some((s) => s.id === camId)
    if (hasStream) {
      setFullscreenId(camId)
      return
    }
    setFocusHint(`Camera ${n} has no stream yet.`)
  }

  const displayStreams = streams
  const placeholders = streams.length === 0 ? ['Waiting for video streams…'] : []

  return (
    <div style={layout}>
      <div style={card}>
        <Link to="/admin/live-feed-landing" style={{ ...secondaryButton, textDecoration: 'none' }}>← Back</Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>Live feed</h1>
        <p style={{ fontSize: '1rem', color: '#9ca3af', marginBottom: '1rem' }}>
          Use Full screen for browser fullscreen — double-click the video (or tile) to exit that mode.
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
            gap: '0.5rem',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <label style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Focus camera #</label>
          <input
            type="number"
            min={1}
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

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <Link to="/admin/notifications" style={{ ...secondaryButton, textDecoration: 'none' }}>View notifications</Link>
          <Link to="/admin/past-recordings" style={{ ...secondaryButton, textDecoration: 'none' }}>View past recordings</Link>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: fullscreenId
              ? '1fr'
              : 'repeat(auto-fill, minmax(400px, 1fr))',
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
                onDoubleClick={() => void handleStreamTileDoubleClick(item.id)}
                ref={(el) => {
                  if (el) tileRefsRef.current.set(item.id, el)
                  else tileRefsRef.current.delete(item.id)
                }}
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
                      el.play().catch(() => { })
                    }
                  }}
                  onDoubleClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    void handleStreamTileDoubleClick(item.id)
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
                  <div style={{ fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginBottom: 2 }}>
                    {cameraMap[item.cameraName] || 'Unknown Hostel'}
                  </div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                    Double-click to expand / exit browser fullscreen
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    openNativeFullscreen(item.id)
                  }}
                  style={{
                    position: 'absolute',
                    right: 8,
                    bottom: 8,
                    background: 'rgba(0,0,0,0.72)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.35)',
                    borderRadius: 6,
                    padding: '4px 8px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                  aria-label={`Open ${item.label} in full-screen mode`}
                  title="Open true full-screen"
                >
                  Full screen
                </button>
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