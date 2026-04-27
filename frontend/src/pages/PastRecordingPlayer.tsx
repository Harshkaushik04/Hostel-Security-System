import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { recordingsStreamUrl } from '../api/client'
import { layout, card, secondaryButton } from '../styles/common'

export default function PastRecordingPlayer() {
  const { cameraName: camParam, filename: fileParam } = useParams<{
    cameraName: string
    filename: string
  }>()
  const [mediaError, setMediaError] = useState('')

  const cameraName = camParam?.trim() ?? ''
  const filename = fileParam?.trim() ?? ''

  const videoUrl = useMemo(() => {
    if (!cameraName || !filename) return null
    return recordingsStreamUrl(cameraName, filename)
  }, [cameraName, filename])

  const backHref =
    cameraName.length > 0
      ? `/admin/past-recordings?camera=${encodeURIComponent(cameraName)}`
      : '/admin/past-recordings'

  if (!videoUrl) {
    return (
      <div style={layout}>
        <div style={card}>
          <Link to={backHref} style={{ ...secondaryButton, textDecoration: 'none' }}>
            ← Back to Past recordings
          </Link>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '1rem' }}>Past recording</h1>
          <p style={{ color: '#f87171', marginTop: '1rem' }}>Missing camera or file name in the URL.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={layout}>
      <div style={card}>
        <Link to={backHref} style={{ ...secondaryButton, textDecoration: 'none' }}>
          ← Back to Past recordings
        </Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>
          {filename}
        </h1>
        <p style={{ fontSize: '0.95rem', color: '#9ca3af', marginBottom: '1rem' }}>
          Camera: <span style={{ color: '#e5e7eb' }}>{cameraName}</span> · Double-click the video for fullscreen
        </p>
        {mediaError && <p style={{ color: '#f87171', marginBottom: '1rem' }}>{mediaError}</p>}
        <div
          style={{
            aspectRatio: '16/9',
            background: '#000',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <video
            key={videoUrl}
            src={videoUrl}
            controls
            playsInline
            style={{ width: '100%', height: '100%', display: 'block' }}
            onError={() =>
              setMediaError(
                'Playback failed. If this segment is still being written, pick an older file or stop recording first.'
              )
            }
            onLoadedData={() => setMediaError('')}
          />
        </div>
      </div>
    </div>
  )
}
