import React, { useState, useEffect, useRef } from 'react'
import { Database, Search, Loader, CheckCircle2, ChevronDown, ChevronUp, AlertCircle, Lock } from 'lucide-react'
import { getSessionId } from '../utils/session'

function VectorStore({ chunks, isIndexed, vectorSearchState, setVectorSearchState, onIndexingComplete, onNavigate }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [indexingComplete, setIndexingComplete] = useState(isIndexed || false)
  const [indexedCount, setIndexedCount] = useState(null)
  const [collectionName, setCollectionName] = useState(null)

  // Search states
  const [searchQuery, setSearchQuery] = useState(vectorSearchState?.searchQuery || '')
  const [searchK, setSearchK] = useState(vectorSearchState?.searchK || 4)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [searchResults, setSearchResults] = useState(vectorSearchState?.searchResults || null)
  const [expandedResultIndex, setExpandedResultIndex] = useState(vectorSearchState?.expandedResultIndex || null)

  const stateRef = useRef({ searchQuery, searchK, searchResults, expandedResultIndex })
  useEffect(() => {
    stateRef.current = { searchQuery, searchK, searchResults, expandedResultIndex }
  }, [searchQuery, searchK, searchResults, expandedResultIndex])

  useEffect(() => {
    return () => {
      if (setVectorSearchState) {
        setVectorSearchState(stateRef.current)
      }
    }
  }, [setVectorSearchState])

  const handleIndex = async () => {
    if (!chunks || chunks.length === 0) return
    setError(null)
    setLoading(true)
    setIndexingComplete(false)

    try {
      const response = await fetch('/api/v1/vector-store/index', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Session-Id': getSessionId()
        },
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
      if (onIndexingComplete) {
        onIndexingComplete(true)
      }
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
        headers: { 
          'Content-Type': 'application/json',
          'X-Session-Id': getSessionId()
        },
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
    <div className="flex flex-col gap-4 font-sans text-sm">
      <p className="text-slate-400 text-xs font-mono">
        Generate high-dimensional Gemini embeddings for the split text segments and index them securely into Qdrant Cloud. Perform semantic search queries to verify retrieval precision.
      </p>

      {!chunks || chunks.length === 0 ? (
        <div className="border border-slate-200 dark:border-border-hairline bg-slate-50 dark:bg-ink-bg p-12 flex flex-col items-center justify-center text-center rounded gap-4 transition-colors duration-200">
          <div className="bg-slate-200 dark:bg-[#0a0c10] border border-slate-300 dark:border-border-hairline p-3 rounded-full">
            <Lock size={28} className="text-slate-500 dark:text-slate-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono uppercase tracking-wider mb-1">Stage Locked</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">Please split your loaded documents into chunks to enable vector store indexing.</p>
          </div>
          <button 
            onClick={() => onNavigate && onNavigate(1)}
            className="mt-2 bg-accent hover:bg-accent-hover text-white py-2 px-5 rounded text-xs font-semibold font-mono tracking-wide uppercase transition-colors"
          >
            Go to Text Splitter
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Indexing trigger panel */}
          {indexingComplete ? (
            <div className="flex flex-col items-center justify-center text-center gap-4 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-900/50 p-8 rounded transition-colors duration-200">
              <div className="bg-emerald-100 dark:bg-emerald-900/40 p-3 rounded-full text-emerald-600 dark:text-emerald-500">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 font-mono tracking-wide uppercase mb-1">Vector Store Ready</h4>
                <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 font-mono">
                  <strong className="text-emerald-700 dark:text-emerald-300">{chunks.length}</strong> chunks indexed into Qdrant.
                </p>
              </div>
              <div className="mt-2 flex gap-3">
                <button 
                  onClick={() => onNavigate && onNavigate(3)}
                  className="bg-accent hover:bg-accent-hover text-white py-2 px-5 rounded text-xs font-semibold font-mono tracking-wide uppercase transition-colors"
                >
                  Continue to RAG Query
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5 bg-slate-50 dark:bg-ink-bg border border-slate-200 dark:border-border-hairline p-4 rounded transition-colors duration-200">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300">Ingestion segments ready</h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    <strong className="text-slate-700 dark:text-slate-200">{chunks.length}</strong> text segments prepared for Gemini embeddings.
                  </p>
                </div>
                <button
                  className="bg-accent hover:bg-accent-hover text-white py-1.5 px-4 rounded text-xs font-semibold font-mono tracking-wide uppercase transition-colors disabled:opacity-40 flex justify-center items-center gap-2"
                  disabled={loading}
                  onClick={handleIndex}
                >
                  {loading ? (
                    <>
                      <Loader size={14} className="animate-spin text-white" />
                      <span>Indexing vectors...</span>
                    </>
                  ) : (
                    <span>Index chunks</span>
                  )}
                </button>
              </div>

              {error && (
                <div className="border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3.5 rounded flex items-start gap-2.5 text-xs font-mono">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {/* Test Search Segment */}
          <div className="border-t border-slate-200 dark:border-border-hairline pt-4 transition-colors duration-200">
            <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 mb-3.5 font-mono uppercase tracking-wider">
              <Search size={14} className="text-accent" />
              <span>Test similarity retrieval</span>
            </h3>

            {!indexingComplete ? (
              <div className="border border-slate-200 dark:border-border-hairline bg-slate-50 dark:bg-ink-bg p-8 flex flex-col items-center justify-center text-center rounded gap-4 transition-colors duration-200">
                <div className="bg-slate-200 dark:bg-[#0a0c10] border border-slate-300 dark:border-border-hairline p-3 rounded-full">
                  <Lock size={24} className="text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono uppercase tracking-wider mb-1">Step 3 Required</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">Generate embeddings and index your document chunks before performing semantic search.</p>
                </div>
                <button 
                  onClick={handleIndex}
                  disabled={loading}
                  className="mt-2 bg-accent hover:bg-accent-hover text-white py-2 px-5 rounded text-xs font-semibold font-mono tracking-wide uppercase transition-colors disabled:opacity-40 flex justify-center items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader size={14} className="animate-spin text-white" />
                      <span>Indexing vectors...</span>
                    </>
                  ) : (
                    <span>Index chunks</span>
                  )}
                </button>
              </div>
            ) : (
              <>
                <form onSubmit={handleSearch} className="flex flex-col gap-3.5 bg-slate-50 dark:bg-ink-bg border border-slate-200 dark:border-border-hairline p-4 rounded transition-colors duration-200">
              <div className="flex gap-4 flex-wrap">
                <div className="flex-grow min-w-[200px] flex flex-col gap-1.5">
                  <label htmlFor="search-input" className="text-xs font-semibold text-slate-600 dark:text-slate-300">Search query</label>
                  <input
                    id="search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter keywords or questions..."
                    className="bg-white dark:bg-[#0a0c10] border border-slate-200 dark:border-border-hairline text-slate-700 dark:text-slate-200 text-xs font-mono px-3 py-2 rounded focus:outline-none focus:border-accent w-full transition-colors duration-200"
                    required
                  />
                </div>
                <div className="w-[100px] flex flex-col gap-1.5">
                  <label htmlFor="search-k" className="text-xs font-semibold text-slate-600 dark:text-slate-300">Results (k)</label>
                  <input
                    id="search-k"
                    type="number"
                    min="1"
                    max="20"
                    value={searchK}
                    onChange={(e) => setSearchK(parseInt(e.target.value) || 4)}
                    className="bg-white dark:bg-[#0a0c10] border border-slate-200 dark:border-border-hairline text-slate-700 dark:text-slate-200 text-xs font-mono px-3 py-2 rounded focus:outline-none focus:border-accent w-full text-center transition-colors duration-200"
                  />
                </div>
              </div>

              {searchError && (
                <div className="border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3.5 rounded flex items-start gap-2.5 text-xs font-mono">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{searchError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-accent hover:bg-accent-hover text-white py-2 px-4 rounded text-xs font-semibold font-mono tracking-wide uppercase transition-colors disabled:opacity-40 flex justify-center items-center gap-2"
                disabled={searching}
              >
                {searching ? (
                  <>
                    <Loader size={14} className="animate-spin text-white" />
                    <span>Searching vector space...</span>
                  </>
                ) : (
                  <>
                    <Search size={14} />
                    <span>Search vector store</span>
                  </>
                )}
              </button>
            </form>

            {searchResults && (
              <div className="border border-slate-200 dark:border-border-hairline bg-white dark:bg-ink-bg rounded p-4 flex flex-col gap-4 mt-4 transition-colors duration-200">
                <div className="flex flex-wrap justify-between items-center border-b border-slate-200 dark:border-border-hairline pb-3 gap-2">
                  <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-mono font-semibold">
                    <CheckCircle2 size={16} />
                    <span>Retrieval complete</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-border-hairline px-2 py-0.5 rounded bg-slate-50 dark:bg-ink-hover">
                    Found <strong className="text-slate-800 dark:text-slate-200">{searchResults.length}</strong> matches
                  </div>
                </div>

                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {searchResults.map((result, idx) => (
                    <div className="border border-slate-200 dark:border-border-hairline bg-slate-50 dark:bg-[#0a0c10] rounded overflow-hidden shrink-0 transition-colors duration-200" key={idx}>
                      <button 
                        className="flex justify-between items-center w-full px-3 py-2 hover:bg-slate-100 dark:hover:bg-ink-hover transition-colors text-left"
                        onClick={() => toggleExpandResult(idx)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-mono border border-slate-200 dark:border-border-hairline px-1 rounded text-accent bg-white dark:bg-ink-surface">Match #{idx + 1}</span>
                          <p className="text-xs text-slate-700 dark:text-slate-300 font-mono truncate">
                            {(() => {
                              const source = result.metadata?.source;
                              if (!source || typeof source !== 'string') return 'document';
                              return source.split(/[/\\]/).pop() || source;
                            })()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                          <span className="border border-slate-200 dark:border-border-hairline px-1.5 py-0.5 rounded bg-white dark:bg-ink-surface text-amber-600 dark:text-amber-500">
                            Score: {result.score.toFixed(4)}
                          </span>
                          {result.metadata?.page !== undefined && result.metadata?.page !== null && (
                            <span className="border border-slate-200 dark:border-border-hairline px-1.5 py-0.5 rounded bg-white dark:bg-ink-surface">Page {Number(result.metadata.page) + 1}</span>
                          )}
                          {expandedResultIndex === idx ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                      </button>
                      {expandedResultIndex === idx && (
                        <div className="p-3 border-t border-slate-200 dark:border-border-hairline bg-white dark:bg-ink-surface flex flex-col gap-2 text-xs transition-colors duration-200">
                          <div>
                            <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">Retrieved Metadata</h4>
                            <pre className="bg-slate-50 dark:bg-[#0a0c10] border border-slate-200 dark:border-border-hairline p-2 font-mono text-[10px] text-slate-600 dark:text-slate-400 overflow-auto select-all rounded max-h-[120px]">
                              {JSON.stringify(result.metadata, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">Chunk Body Content</h4>
                            <div className="bg-slate-50 dark:bg-[#0a0c10] border border-slate-200 dark:border-border-hairline p-2 text-xs text-slate-700 dark:text-slate-300 font-sans whitespace-pre-wrap rounded max-h-[150px] overflow-y-auto">
                              {result.page_content}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default VectorStore
