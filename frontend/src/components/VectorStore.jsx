import React, { useState } from 'react'
import { Database, Search, Loader, CheckCircle2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'

function VectorStore({ chunks }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [indexingComplete, setIndexingComplete] = useState(false)
  const [indexedCount, setIndexedCount] = useState(null)
  const [collectionName, setCollectionName] = useState(null)

  // Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [searchK, setSearchK] = useState(4)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [searchResults, setSearchResults] = useState(null)
  const [expandedResultIndex, setExpandedResultIndex] = useState(null)

  const handleIndex = async () => {
    if (!chunks || chunks.length === 0) return
    setError(null)
    setLoading(true)
    setIndexingComplete(false)

    try {
      const response = await fetch('/api/v1/vector-store/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: chunks }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `Server error: ${response.statusText}`)
      }

      const results = await response.json()
      setIndexedCount(results.indexed_count)
      setCollectionName(results.collection)
      setIndexingComplete(true)
    } catch (err) {
      setError(err.message || 'Failed to index chunks in Qdrant.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearchError(null)
    setSearching(true)
    setSearchResults(null)
    setExpandedResultIndex(null)

    try {
      const response = await fetch('/api/v1/vector-store/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          k: searchK,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `Server error: ${response.statusText}`)
      }

      const results = await response.json()
      setSearchResults(results)
    } catch (err) {
      setSearchError(err.message || 'Failed to query vector database.')
    } finally {
      setSearching(false)
    }
  }

  const toggleExpandResult = (index) => {
    setExpandedResultIndex(expandedResultIndex === index ? null : index)
  }

  return (
    <div className="doc-loader-wrapper">
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1rem' }}>
        Generate high-dimensional Gemini embeddings for the split text segments and index them securely into Qdrant Cloud. Perform semantic search queries to verify retrieval precision.
      </p>

      {!chunks || chunks.length === 0 ? (
        <div className="drop-zone" style={{ borderStyle: 'solid', cursor: 'default', opacity: 0.6 }}>
          <Database size={40} className="cloud-icon" />
          <p style={{ color: 'var(--text-secondary)' }}>
            Please split your loaded documents into chunks to enable vector store indexing.
          </p>
        </div>
      ) : (
        <div className="website-inputs">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'rgba(255, 255, 255, 0.01)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', fontFamily: 'Outfit' }}>Ingestion Data Ready</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <strong>{chunks.length}</strong> text segments prepared for Gemini embeddings.
                </p>
              </div>
              <button
                className="load-action-btn"
                style={{
                  margin: 0,
                  width: 'auto',
                  padding: '0.75rem 2rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                }}
                disabled={loading}
                onClick={handleIndex}
              >
                {loading ? (
                  <>
                    <Loader size={18} className="spinner" />
                    <span>Indexing Vectors...</span>
                  </>
                ) : (
                  <span>Index Chunks</span>
                )}
              </button>
            </div>

            {error && (
              <div className="error-card" style={{ margin: 0 }}>
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {indexingComplete && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '8px' }}>
                <CheckCircle2 size={20} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ fontWeight: 600, color: '#10b981', fontSize: '0.95rem' }}>Indexing Complete</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    Successfully embedded and written <strong>{indexedCount}</strong> vectors into collection <code>{collectionName}</code>.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'Outfit' }}>
              <Search size={20} style={{ color: 'var(--color-accent)' }} />
              Test Similarity Retrieval
            </h3>

            <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <label htmlFor="search-input" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Search Query</label>
                  <input
                    id="search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter keywords or questions..."
                    className="website-url-input"
                    style={{ width: '100%' }}
                    required
                  />
                </div>
                <div style={{ width: '100px' }}>
                  <label htmlFor="search-k" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Results (k)</label>
                  <input
                    id="search-k"
                    type="number"
                    min="1"
                    max="20"
                    value={searchK}
                    onChange={(e) => setSearchK(parseInt(e.target.value) || 4)}
                    className="website-url-input"
                    style={{ width: '100%', textAlign: 'center' }}
                  />
                </div>
              </div>

              {searchError && (
                <div className="error-card" style={{ margin: 0 }}>
                  <AlertCircle size={20} />
                  <span>{searchError}</span>
                </div>
              )}

              <button
                type="submit"
                className="load-action-btn"
                style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                disabled={searching}
              >
                {searching ? (
                  <>
                    <Loader size={20} className="spinner" />
                    <span>Searching Vector Space...</span>
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    <span>Execute Search Query</span>
                  </>
                )}
              </button>
            </form>

            {searchResults && (
              <div className="results-pane" style={{ marginTop: '1.5rem' }}>
                <div className="results-header">
                  <div className="success-title">
                    <CheckCircle2 size={22} className="success-icon" style={{ color: 'var(--color-accent)' }} />
                    <h3>Retrieval Complete</h3>
                  </div>
                  <div className="stats-row">
                    <div className="stat-pill">
                      Found <strong>{searchResults.length}</strong> matches
                    </div>
                  </div>
                </div>

                <div className="documents-list">
                  {searchResults.map((result, idx) => (
                    <div className="doc-item" key={idx}>
                      <div
                        className={`doc-item-header ${expandedResultIndex === idx ? 'expanded' : ''}`}
                        onClick={() => toggleExpandResult(idx)}
                      >
                        <div className="doc-meta-title">
                          <span className="doc-index-badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--color-accent)' }}>
                            Match #{idx + 1}
                          </span>
                          <p className="doc-source-name">
                            {(() => {
                              const source = result.metadata?.source;
                              if (!source || typeof source !== 'string') return 'document';
                              const cleanParts = source.split('/').filter(Boolean);
                              return cleanParts.pop() || source;
                            })()}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="page-badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                            Score: {result.score.toFixed(4)}
                          </span>
                          {result.metadata?.page !== undefined && result.metadata?.page !== null && (
                            <span className="page-badge">Page {Number(result.metadata.page) + 1}</span>
                          )}
                          {expandedResultIndex === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>
                      {expandedResultIndex === idx && (
                        <div className="doc-item-body">
                          <div className="metadata-viewer">
                            <h4>Retrieved Metadata</h4>
                            <pre>{JSON.stringify(result.metadata, null, 2)}</pre>
                          </div>
                          <div className="content-viewer">
                            <h4>Chunk Body Content</h4>
                            <p style={{ whiteSpace: 'pre-wrap' }}>{result.page_content}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default VectorStore
