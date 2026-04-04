import React, { useState, useEffect } from 'react'
import { Layers, HelpCircle, Loader, CheckCircle2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'

function TextSplitter({ documents, onChunksGenerated, chunks }) {
  const [chunkSize, setChunkSize] = useState(1000)
  const [chunkOverlap, setChunkOverlap] = useState(200)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expandedChunkIndex, setExpandedChunkIndex] = useState(null)

  // Automatically ensure overlap is less than size if size changes
  useEffect(() => {
    if (chunkOverlap >= chunkSize) {
      setChunkOverlap(Math.max(0, chunkSize - 50))
    }
  }, [chunkSize, chunkOverlap])

  const handleSplit = async () => {
    if (!documents || documents.length === 0) return
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/v1/text-splitter/split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documents,
          chunk_size: chunkSize,
          chunk_overlap: chunkOverlap,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `Server error: ${response.statusText}`)
      }

      const results = await response.json()
      onChunksGenerated(results)
    } catch (err) {
      setError(err.message || 'Failed to split documents.')
    } finally {
      setLoading(false)
    }
  }

  const toggleExpandChunk = (index) => {
    setExpandedChunkIndex(expandedChunkIndex === index ? null : index)
  }

  const averageChunkLength = chunks && chunks.length > 0
    ? Math.round(chunks.reduce((sum, c) => sum + c.page_content.length, 0) / chunks.length)
    : 0

  return (
    <div className="doc-loader-wrapper">
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1rem' }}>
        Divide the loaded document text into small, overlapping chunks to ensure the vector index receives clean, context-rich segments.
      </p>

      {!documents || documents.length === 0 ? (
        <div className="drop-zone" style={{ borderStyle: 'solid', cursor: 'default', opacity: 0.6 }}>
          <Layers size={40} className="cloud-icon" />
          <p style={{ color: 'var(--text-secondary)' }}>
            Please ingest a knowledge source first to enable text chunking.
          </p>
        </div>
      ) : (
        <div className="website-inputs">
          <div className="input-group">
            <div className="slider-header">
              <label htmlFor="size-input">Chunk Size (characters)</label>
              <span className="slider-value">{chunkSize}</span>
            </div>
            <input
              id="size-input"
              type="range"
              min="100"
              max="3000"
              step="50"
              value={chunkSize}
              onChange={(e) => setChunkSize(parseInt(e.target.value))}
              className="custom-slider"
            />
            <span className="slider-hint">The maximum character count per text segment.</span>
          </div>

          <div className="input-group">
            <div className="slider-header">
              <label htmlFor="overlap-input">Chunk Overlap (characters)</label>
              <span className="slider-value">{chunkOverlap}</span>
            </div>
            <input
              id="overlap-input"
              type="range"
              min="0"
              max={Math.max(0, chunkSize - 50)}
              step="10"
              value={chunkOverlap}
              onChange={(e) => setChunkOverlap(parseInt(e.target.value))}
              className="custom-slider"
            />
            <span className="slider-hint">Overlap size to maintain context between adjacent chunks.</span>
          </div>

          {error && (
            <div className="error-card">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <button
            className="load-action-btn"
            style={{ background: 'linear-gradient(135deg, var(--color-accent) 0%, #4f46e5 100%)' }}
            disabled={loading}
            onClick={handleSplit}
          >
            {loading ? (
              <>
                <Loader size={20} className="spinner" />
                <span>Splitting Documents...</span>
              </>
            ) : (
              <span>Chunk Documents</span>
            )}
          </button>

          {chunks && chunks.length > 0 && (
            <div className="results-pane">
              <div className="results-header">
                <div className="success-title">
                  <CheckCircle2 size={22} className="success-icon" style={{ color: 'var(--color-accent)' }} />
                  <h3>Splitting Complete</h3>
                </div>
                <div className="stats-row">
                  <div className="stat-pill">
                    <strong>{chunks.length}</strong> Chunks
                  </div>
                  <div className="stat-pill">
                    <strong>{averageChunkLength}</strong> Avg Chars
                  </div>
                </div>
              </div>

              <div className="documents-list">
                {chunks.map((chunk, idx) => (
                  <div className="doc-item" key={idx}>
                    <div
                      className={`doc-item-header ${expandedChunkIndex === idx ? 'expanded' : ''}`}
                      onClick={() => toggleExpandChunk(idx)}
                    >
                      <div className="doc-meta-title">
                        <span className="doc-index-badge">Chunk #{idx + 1}</span>
                        <p className="doc-source-name">
                          {chunk.metadata?.source?.split('/').pop() || chunk.metadata?.source || 'chunk'}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="page-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>
                          {chunk.page_content.length} chars
                        </span>
                        {chunk.metadata?.page && (
                          <span className="page-badge">Page {chunk.metadata.page}</span>
                        )}
                        {expandedChunkIndex === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                    {expandedChunkIndex === idx && (
                      <div className="doc-item-body">
                        <div className="metadata-viewer">
                          <h4>Chunk Metadata</h4>
                          <pre>{JSON.stringify(chunk.metadata, null, 2)}</pre>
                        </div>
                        <div className="content-viewer">
                          <h4>Segment Content</h4>
                          <p>{chunk.page_content}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TextSplitter
