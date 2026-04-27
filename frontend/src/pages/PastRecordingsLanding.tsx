import { useState, useMemo, useEffect, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { listRecordings } from '../api/endpoints'
import { layout, card, inputStyle, primaryButton, secondaryButton } from '../styles/common'

const DEFAULT_CAMERA =
  (import.meta.env.VITE_RECORDINGS_CAMERA as string | undefined)?.trim() || 'camera1'

/** Parse timestamp from segment filename `YYYY-MM-DD_HH-MM-SS.mp4`. */
function parseRecordingTimeMs(name: string): number | null {
  const m = name.match(/^(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})-(\d{2})\.mp4$/i)
  if (!m) return null
  const d = new Date(`${m[1]}T${m[2]}:${m[3]}:${m[4]}`)
  const t = d.getTime()
  return Number.isNaN(t) ? null : t
}

export default function PastRecordingsLanding() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [cameraName, setCameraName] = useState(() => {
    const q = searchParams.get('camera')?.trim()
    return q || DEFAULT_CAMERA
  })
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [files, setFiles] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadRecordings = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const { files: list } = await listRecordings(cameraName)
      setFiles(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load recordings')
      setFiles([])
    } finally {
      setLoading(false)
    }
  }, [cameraName])

  useEffect(() => {
    void loadRecordings()
  }, [loadRecordings])

  const filteredFiles = useMemo(() => {
    if (!start && !end) return files
    const startMs = start ? new Date(start).getTime() : null
    const endMs = end ? new Date(end).getTime() : null
    return files.filter((name) => {
      const t = parseRecordingTimeMs(name)
      if (t === null) return true
      if (startMs !== null && !Number.isNaN(startMs) && t < startMs) return false
      if (endMs !== null && !Number.isNaN(endMs) && t > endMs) return false
      return true
    })
  }, [files, start, end])

  const openPlayer = (filename: string) => {
    navigate(
      `/admin/past-recordings/play/${encodeURIComponent(cameraName.trim())}/${encodeURIComponent(filename)}`
    )
  }

  return (
    <div style={layout}>
      <div style={card}>
        <Link to="/admin/live-feed-landing" style={{ ...secondaryButton, textDecoration: 'none' }}>
          ← Back
        </Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>
          Past recordings
        </h1>
        <p style={{ fontSize: '1rem', color: '#9ca3af', marginBottom: '1rem' }}>
          Load MP4 segments saved by the backend, optionally narrow by time (parsed from filenames), then open a
          file in the player.
        </p>
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
          }}
        >
          <div style={{ display: 'grid', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.9rem', color: '#e5e7eb' }}>Camera</label>
            <input
              type="text"
              style={{ ...inputStyle, minWidth: '12rem' }}
              value={cameraName}
              onChange={(e) => setCameraName(e.target.value)}
              placeholder="e.g. camera1"
            />
          </div>
          <button type="button" style={primaryButton} onClick={() => void loadRecordings()} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          <div style={{ display: 'grid', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.9rem', color: '#e5e7eb' }}>Filter from</label>
            <input type="datetime-local" style={inputStyle} value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.9rem', color: '#e5e7eb' }}>Filter to</label>
            <input type="datetime-local" style={inputStyle} value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        {error && <p style={{ color: '#f87171', marginBottom: '1rem' }}>{error}</p>}
        {!loading && !error && filteredFiles.length === 0 && (
          <p style={{ color: '#9ca3af' }}>No recordings found for this camera (or none match the time filter).</p>
        )}
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {filteredFiles.map((filename) => (
            <button
              key={filename}
              type="button"
              style={{ ...secondaryButton, textAlign: 'left' }}
              onClick={() => openPlayer(filename)}
            >
              {filename}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
