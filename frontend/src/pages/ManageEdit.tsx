import { useState } from 'react'
import { Link } from 'react-router-dom'
import { uploadManually, uploadCsv } from '../api/endpoints'
import { layout, card, primaryButton, secondaryButton, inputStyle } from '../styles/common'

export default function ManageEdit() {
  const [manualData, setManualData] = useState('')
  const [manualResult, setManualResult] = useState('')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvResult, setCsvResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUploadManually = async () => {
    setError('')
    setManualResult('')
    setLoading(true)
    try {
      const body = JSON.parse(manualData || '{}')
      const res = await uploadManually(body)
      setManualResult(JSON.stringify(res))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON or request failed')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadCsv = async () => {
    if (!csvFile) { setError('Select a file'); return }
    setError('')
    setCsvResult('')
    setLoading(true)
    try {
      const form = new FormData()
      form.append('file', csvFile)
      const res = await uploadCsv(form)
      setCsvResult(JSON.stringify(res))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={layout}>
      <div style={card}>
        <Link to="/admin/manage" style={{ ...secondaryButton, textDecoration: 'none' }}>← Back to Manage list</Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>
          Manage students / admin — Add, delete, edit
        </h1>
        <p style={{ fontSize: '1rem', color: '#9ca3af', marginBottom: '1.5rem' }}>
          [express] /upload-manually, /upload-csv
        </p>
        {error && <p style={{ color: '#f87171', marginBottom: '1rem' }}>{error}</p>}
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <section>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Upload manually (JSON)</h2>
            <textarea
              style={{ ...inputStyle, minHeight: 120 }}
              placeholder='{"name":"...", ...}'
              value={manualData}
              onChange={(e) => setManualData(e.target.value)}
            />
            <button type="button" style={primaryButton} onClick={handleUploadManually} disabled={loading}>Submit</button>
            {manualResult && <pre style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: 8 }}>{manualResult}</pre>}
          </section>
          <section>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Upload CSV</h2>
            <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)} style={{ color: '#e5e7eb' }} />
            <button type="button" style={primaryButton} onClick={handleUploadCsv} disabled={loading || !csvFile}>Upload CSV</button>
            {csvResult && <pre style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: 8 }}>{csvResult}</pre>}
          </section>
        </div>
      </div>
    </div>
  )
}
