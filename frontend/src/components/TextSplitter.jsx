import React, { useState } from 'react'
import { Layers, AlertCircle, Loader, CheckCircle2, ChevronDown, ChevronUp, Lock } from 'lucide-react'

function TextSplitter({ documents, onChunksGenerated, chunks, onNavigate }) {
  const [chunkSize, setChunkSize] = useState(1000)
  const [chunkOverlap, setChunkOverlap] = useState(200)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expandedChunkIndex, setExpandedChunkIndex] = useState(null)

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

  const isInvalidOverlap = chunkOverlap >= chunkSize

  return (
    <div className="flex flex-col gap-4 font-sans text-sm">
      <p className="text-slate-400 text-xs font-mono">
        Divide the loaded document text into small, overlapping chunks to ensure the vector index receives clean, context-rich segments.
      </p>

      {!documents || documents.length === 0 ? (
        <div className="border border-slate-200 dark:border-border-hairline bg-slate-50 dark:bg-ink-bg p-12 flex flex-col items-center justify-center text-center rounded gap-4 transition-colors duration-200">
          <div className="bg-slate-200 dark:bg-[#0a0c10] border border-slate-300 dark:border-border-hairline p-3 rounded-full">
            <Lock size={28} className="text-slate-500 dark:text-slate-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono uppercase tracking-wider mb-1">Stage Locked</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">Please load a knowledge source first to enable text chunking configurations.</p>
          </div>
          <button 
            onClick={() => onNavigate && onNavigate(0)}
            className="mt-2 bg-accent hover:bg-accent-hover text-white py-2 px-5 rounded text-xs font-semibold font-mono tracking-wide uppercase transition-colors"
          >
            Go to Document Loader
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 bg-slate-50 dark:bg-ink-bg border border-slate-200 dark:border-border-hairline p-4 rounded transition-colors duration-200">
            {/* Chunk Size */}
            <div className="flex flex-col gap-3.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Chunk Size</label>
              <div className="flex items-center gap-3">
                <input
                  id="size-input"
                  type="range"
                  min="100"
                  max="2000"
                  step="100"
                  value={chunkSize}
                  onChange={(e) => setChunkSize(parseInt(e.target.value))}
                  className="flex-grow h-1 bg-slate-200 dark:bg-[#0a0c10] rounded-lg appearance-none cursor-pointer accent-accent border border-slate-300 dark:border-border-hairline"
                />
                <span className="text-xs font-mono w-12 text-right text-slate-500 dark:text-slate-400">{chunkSize}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">The maximum character count per text segment.</span>
            </div>

            {/* Chunk Overlap */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <label htmlFor="overlap-input" className="font-semibold text-slate-600 dark:text-slate-300">Chunk overlap (characters)</label>
                <span className="font-mono text-accent">{chunkOverlap}</span>
              </div>
              <input
                id="overlap-input"
                type="range"
                min="0"
                max="500"
                step="10"
                value={chunkOverlap}
                onChange={(e) => setChunkOverlap(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-200 dark:bg-[#0a0c10] rounded-lg appearance-none cursor-pointer accent-accent border border-slate-300 dark:border-border-hairline"
              />
              {isInvalidOverlap ? (
                <span className="text-[10px] font-mono text-red-600 dark:text-red-400 flex items-center gap-1 mt-0.5">
                  <AlertCircle size={10} /> Chunk overlap must be strictly less than chunk size.
                </span>
              ) : (
                <span className="text-[10px] font-mono text-slate-500 mt-0.5">Overlap size to maintain context between adjacent chunks.</span>
              )}
            </div>
          </div>

          {error && (
            <div className="border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3.5 rounded flex items-start gap-2.5 text-xs font-mono">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            className="w-full bg-accent hover:bg-accent-hover text-white py-2 px-4 rounded text-xs font-semibold font-mono tracking-wide uppercase transition-colors disabled:opacity-40 flex justify-center items-center gap-2"
            disabled={loading || isInvalidOverlap}
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
            <div className="border border-slate-200 dark:border-border-hairline bg-white dark:bg-ink-bg rounded p-4 flex flex-col gap-4 mt-2 transition-colors duration-200">
              <div className="flex flex-wrap justify-between items-center border-b border-slate-200 dark:border-border-hairline pb-3 gap-2">
                <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-mono font-semibold">
                  <CheckCircle2 size={16} />
                  <span>Splitting complete</span>
                </div>
                <div className="flex gap-2 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  <span className="border border-slate-200 dark:border-border-hairline px-2 py-0.5 rounded bg-slate-50 dark:bg-ink-hover">
                    <strong className="text-slate-800 dark:text-slate-200">{chunks.length}</strong> chunks
                  </span>
                  <span className="border border-slate-200 dark:border-border-hairline px-2 py-0.5 rounded bg-slate-50 dark:bg-ink-hover">
                    <strong className="text-slate-800 dark:text-slate-200">{averageChunkLength}</strong> avg chars
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                {chunks.map((chunk, idx) => (
                  <div className="border border-slate-200 dark:border-border-hairline bg-white dark:bg-[#0a0c10] rounded overflow-hidden shrink-0" key={idx}>
                    <button 
                      className="flex justify-between items-center w-full px-3 py-2 hover:bg-slate-100 dark:hover:bg-ink-hover transition-colors text-left"
                      onClick={() => toggleExpandChunk(idx)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-mono border border-slate-200 dark:border-border-hairline px-1 rounded text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-ink-surface">#{idx + 1}</span>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-mono truncate">
                          {(() => {
                            const source = chunk.metadata?.source;
                            if (!source || typeof source !== 'string') return 'chunk';
                            return source.split(/[/\\]/).pop() || source;
                          })()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="border border-slate-200 dark:border-border-hairline px-1.5 py-0.5 rounded bg-white dark:bg-ink-surface text-emerald-600 dark:text-emerald-500">
                          {chunk.page_content.length} chars
                        </span>
                        {chunk.metadata?.page !== undefined && chunk.metadata?.page !== null && (
                          <span className="border border-slate-200 dark:border-border-hairline px-1.5 py-0.5 rounded bg-white dark:bg-ink-surface">Page {Number(chunk.metadata.page) + 1}</span>
                        )}
                        {expandedChunkIndex === idx ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </button>
                    {expandedChunkIndex === idx && (
                      <div className="p-3 border-t border-slate-200 dark:border-border-hairline bg-slate-50 dark:bg-ink-surface flex flex-col gap-2 text-xs transition-colors duration-200">
                        <div>
                          <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">Chunk Metadata</h4>
                          <pre className="bg-white dark:bg-[#0a0c10] border border-slate-200 dark:border-border-hairline p-2 font-mono text-[10px] text-slate-600 dark:text-slate-400 overflow-auto select-all rounded max-h-[120px]">
                            {JSON.stringify(chunk.metadata, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">Segment Content</h4>
                          <div className="bg-white dark:bg-[#0a0c10] border border-slate-200 dark:border-border-hairline p-2 text-xs text-slate-700 dark:text-slate-300 font-sans whitespace-pre-wrap rounded max-h-[150px] overflow-y-auto">
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
