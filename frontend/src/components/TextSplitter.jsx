import React, { useState, useEffect } from 'react'
import { Layers, AlertCircle, Loader, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'

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
    <div className="flex flex-col gap-4 font-sans text-sm">
      <p className="text-slate-400 text-xs font-mono">
        Divide the loaded document text into small, overlapping chunks to ensure the vector index receives clean, context-rich segments.
      </p>

      {!documents || documents.length === 0 ? (
        <div className="border border-border-hairline bg-ink-bg p-8 flex flex-col items-center justify-center text-center text-slate-500 rounded gap-2.5">
          <Layers size={36} className="text-slate-600" />
          <div>
            <p className="text-xs text-slate-400 font-mono">Ingestion buffer empty</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Please load a knowledge source first to enable text chunking configurations.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 bg-ink-bg border border-border-hairline p-4 rounded">
            {/* Chunk Size */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <label htmlFor="size-input" className="font-semibold text-slate-300">Chunk size (characters)</label>
                <span className="font-mono text-accent">{chunkSize}</span>
              </div>
              <input
                id="size-input"
                type="range"
                min="100"
                max="3000"
                step="50"
                value={chunkSize}
                onChange={(e) => setChunkSize(parseInt(e.target.value))}
                className="w-full h-1 bg-[#0a0c10] rounded-lg appearance-none cursor-pointer accent-accent border border-border-hairline"
              />
              <span className="text-[10px] font-mono text-slate-500">The maximum character count per text segment.</span>
            </div>

            {/* Chunk Overlap */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <label htmlFor="overlap-input" className="font-semibold text-slate-300">Chunk overlap (characters)</label>
                <span className="font-mono text-accent">{chunkOverlap}</span>
              </div>
              <input
                id="overlap-input"
                type="range"
                min="0"
                max={Math.max(0, chunkSize - 50)}
                step="10"
                value={chunkOverlap}
                onChange={(e) => setChunkOverlap(parseInt(e.target.value))}
                className="w-full h-1 bg-[#0a0c10] rounded-lg appearance-none cursor-pointer accent-accent border border-border-hairline"
              />
              <span className="text-[10px] font-mono text-slate-500">Overlap size to maintain context between adjacent chunks.</span>
            </div>
          </div>

          {error && (
            <div className="border border-red-900/50 bg-red-950/20 text-red-400 p-3.5 rounded flex items-start gap-2.5 text-xs font-mono">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            className="w-full bg-accent hover:bg-accent-hover text-white py-2 px-4 rounded text-xs font-semibold font-mono tracking-wide uppercase transition-colors disabled:opacity-40 flex justify-center items-center gap-2"
            disabled={loading}
            onClick={handleSplit}
          >
            {loading ? (
              <>
                <Loader size={14} className="animate-spin text-white" />
                <span>Splitting documents...</span>
              </>
            ) : (
              <span>Split documents</span>
            )}
          </button>

          {chunks && chunks.length > 0 && (
            <div className="border border-border-hairline bg-ink-bg rounded p-4 flex flex-col gap-4 mt-2">
              <div className="flex flex-wrap justify-between items-center border-b border-border-hairline pb-3 gap-2">
                <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-mono font-semibold">
                  <CheckCircle2 size={16} />
                  <span>Splitting complete</span>
                </div>
                <div className="flex gap-2 text-[10px] font-mono text-slate-400">
                  <span className="border border-border-hairline px-2 py-0.5 rounded bg-ink-hover">
                    <strong className="text-slate-200">{chunks.length}</strong> chunks
                  </span>
                  <span className="border border-border-hairline px-2 py-0.5 rounded bg-ink-hover">
                    <strong className="text-slate-200">{averageChunkLength}</strong> avg chars
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                {chunks.map((chunk, idx) => (
                  <div className="border border-border-hairline bg-[#0a0c10] rounded overflow-hidden" key={idx}>
                    <button 
                      className="flex justify-between items-center w-full px-3 py-2 hover:bg-ink-hover transition-colors text-left"
                      onClick={() => toggleExpandChunk(idx)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-mono border border-border-hairline px-1 rounded text-slate-400 bg-ink-surface">#{idx + 1}</span>
                        <p className="text-xs text-slate-300 font-mono truncate">
                          {(() => {
                            const source = chunk.metadata?.source;
                            if (!source || typeof source !== 'string') return 'chunk';
                            return source.split(/[/\\]/).pop() || source;
                          })()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 font-mono text-[10px] text-slate-400">
                        <span className="border border-border-hairline px-1.5 py-0.5 rounded bg-ink-surface text-emerald-500">
                          {chunk.page_content.length} chars
                        </span>
                        {chunk.metadata?.page !== undefined && chunk.metadata?.page !== null && (
                          <span className="border border-border-hairline px-1.5 py-0.5 rounded bg-ink-surface">Page {Number(chunk.metadata.page) + 1}</span>
                        )}
                        {expandedChunkIndex === idx ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </button>
                    {expandedChunkIndex === idx && (
                      <div className="p-3 border-t border-border-hairline bg-ink-surface flex flex-col gap-2 text-xs">
                        <div>
                          <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">Chunk Metadata</h4>
                          <pre className="bg-[#0a0c10] border border-border-hairline p-2 font-mono text-[10px] text-slate-400 overflow-x-auto select-all rounded max-h-[120px]">
                            {JSON.stringify(chunk.metadata, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">Segment Content</h4>
                          <div className="bg-[#0a0c10] border border-border-hairline p-2 text-xs text-slate-300 font-sans whitespace-pre-wrap rounded max-h-[150px] overflow-y-auto">
                            {chunk.page_content}
                          </div>
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
