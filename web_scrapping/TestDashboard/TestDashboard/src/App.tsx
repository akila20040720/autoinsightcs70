import { useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Vehicle = {
  'Vehicle Type': string | null
  Make: string | null
  Model: string | null
  Year: number | null
  Price: string | null
  Milleage: number | null
  District: string | null
  'published date': string | null
  'Vehicle URL': string | null
}

type StreamMeta = {
  total: number
  pages_scraped: number
  elapsed_seconds: number
  done: boolean
}

function App() {
  const [vehicleType, setVehicleType] = useState('cars')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [maxResults, setMaxResults] = useState(200)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<Vehicle[]>([])
  const [meta, setMeta] = useState<StreamMeta | null>(null)
  const sourceRef = useRef<EventSource | null>(null)

  const canSearch = useMemo(() => make.trim().length > 0, [make])

  const stopStream = () => {
    if (sourceRef.current) {
      sourceRef.current.close()
      sourceRef.current = null
    }
    setLoading(false)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setResults([])
    setMeta(null)
    stopStream()
    setLoading(true)

    const params = new URLSearchParams({
      vehicle_type: vehicleType,
      make: make.trim(),
      model: model.trim(),
      year: year.trim(),
      max_results: String(maxResults),
    })

    const source = new EventSource(`/api/search/stream?${params.toString()}`)
    sourceRef.current = source

    source.onmessage = (e) => {
      try {
        const vehicle = JSON.parse(e.data) as Vehicle
        setResults((prev) => [...prev, vehicle])
      } catch {
        // skip malformed event
      }
    }

    source.addEventListener('done', (e: Event) => {
      try {
        const doneMeta = JSON.parse((e as MessageEvent).data) as Omit<StreamMeta, 'done'>
        setMeta({ ...doneMeta, done: true })
      } catch {
        setMeta((prev) =>
          prev ? { ...prev, done: true } : { total: 0, pages_scraped: 0, elapsed_seconds: 0, done: true }
        )
      }
      source.close()
      sourceRef.current = null
      setLoading(false)
    })

    source.addEventListener('scrape_error', (e: Event) => {
      try {
        const { error: msg } = JSON.parse((e as MessageEvent).data) as { error: string }
        setError(msg)
      } catch {
        setError('Unexpected error during streaming.')
      }
      source.close()
      sourceRef.current = null
      setLoading(false)
    })

    source.onerror = () => {
      if (!sourceRef.current) return
      setError('Connection to the scraper was lost.')
      source.close()
      sourceRef.current = null
      setLoading(false)
    }
  }

  return (
    <main className="page">
      <header className="hero">
        <p className="eyebrow">AutoInsight Dashboard</p>
        <h1>Riyasewana Search Filter</h1>
        <p className="subtitle">Search vehicles from the Flask scraping API using make, model, year, and type filters.</p>
      </header>

      <section className="panel">
        <form className="filters" onSubmit={handleSubmit}>
          <label>
            Vehicle Type
            <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
              <option value="cars">Cars</option>
              <option value="vans">Vans</option>
              <option value="pickups">Pickups</option>
              <option value="suvs">SUVs</option>
            </select>
          </label>

          <label>
            Make (required)
            <input
              value={make}
              onChange={(e) => setMake(e.target.value)}
              placeholder="toyota"
              required
            />
          </label>

          <label>
            Model
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="corolla"
            />
          </label>

          <label>
            Year
            <input
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2018"
              pattern="\d{4}"
              title="Use a 4-digit year"
            />
          </label>

          <label>
            Max Results
            <input
              type="number"
              min={1}
              max={1000}
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value) || 200)}
            />
          </label>

          <button type="submit" disabled={!canSearch || loading}>
            {loading ? 'Searching...' : 'Search Vehicles'}
          </button>

          {loading && (
            <button type="button" className="btn-stop" onClick={stopStream}>
              Stop
            </button>
          )}
        </form>
      </section>

      {error ? <p className="message error">{error}</p> : null}

      {results.length > 0 && (
        <section className="results">
          <div className="result-meta">
            {meta?.done ? (
              <>
                <strong>{meta.total}</strong> results &mdash; {meta.elapsed_seconds}s &mdash; {meta.pages_scraped} page(s)
              </>
            ) : (
              <>
                <span className="live-badge">LIVE</span>{' '}
                <strong>{results.length}</strong> results so far&hellip;
              </>
            )}
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Make</th>
                  <th>Model</th>
                  <th>Year</th>
                  <th>Price</th>
                  <th>Mileage</th>
                  <th>District</th>
                  <th>Date</th>
                  <th>Link</th>
                </tr>
              </thead>
              <tbody>
                {results.map((vehicle, index) => (
                  <tr key={`${vehicle['Vehicle URL'] || 'row'}-${index}`}>
                    <td>{vehicle['Vehicle Type'] || '-'}</td>
                    <td>{vehicle.Make || '-'}</td>
                    <td>{vehicle.Model || '-'}</td>
                    <td>{vehicle.Year || '-'}</td>
                    <td>{vehicle.Price || '-'}</td>
                    <td>{vehicle.Milleage ? `${vehicle.Milleage} km` : '-'}</td>
                    <td>{vehicle.District || '-'}</td>
                    <td>{vehicle['published date'] || '-'}</td>
                    <td>
                      {vehicle['Vehicle URL'] ? (
                        <a href={vehicle['Vehicle URL']} target="_blank" rel="noreferrer">
                          Open
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  )
}

export default App
