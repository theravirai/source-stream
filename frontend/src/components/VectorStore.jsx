import React, { useState, useEffect, useRef } from 'react'
import { Database, Search, Loader, CheckCircle2, ChevronDown, ChevronUp, AlertCircle, Lock } from 'lucide-react'
import { getSessionId } from '../utils/session'

function VectorStore({ chunks, isIndexed, earliestIncompleteStep, vectorSearchState, setVectorSearchState, onIndexingComplete, onNavigate }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [indexingComplete, setIndexingComplete] = useState(isIndexed || false)
  const [indexedCount, setIndexedCount] = useState(null)
  const [collectionName, setCollectionName] = useState(null)
  const [indexingTime, setIndexingTime] = useState(null)
  const [progressStage, setProgressStage] = useState(0)

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

  useEffect(() => {
    let interval;
    if (loading) {
      setProgressStage(0)
      interval = setInterval(() => {
        setProgressStage((prev) => (prev < 3 ? prev + 1 : 3))
      }, 1500)
    } else {
      setProgressStage(0)
    }
    return () => clearInterval(interval)
  }, [loading])

  const handleIndex = async () => {
    if (!chunks || chunks.length === 0) return
    setError(null)
    setLoading(true)
    setIndexingComplete(false)

    try {
      const startTime = performance.now()
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
      const endTime = performance.now()
      
      setIndexedCount(results.indexed_count)
      setCollectionName(results.collection)
      setIndexingTime(((endTime - startTime) / 1000).toFixed(1))
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

    const finalK = parseInt(searchK, 10) || 4
    if (searchK !== finalK) setSearchK(finalK)

    try {
      const response = await fetch('/api/v1/vector-store/search', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Session-Id': getSessionId()
        },
        body: JSON.stringify({
          query: searchQuery,
          k: finalK,
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
            onClick={() => onNavigate && onNavigate(earliestIncompleteStep !== undefined ? earliestIncompleteStep : 1)}
            className="mt-2 bg-accent hover:bg-accent-hover text-white py-2 px-5 rounded text-xs font-semibold font-mono tracking-wide uppercase transition-colors"
          >
            {earliestIncompleteStep === 0 ? 'Go to Document Loader' : 'Go to Text Splitter'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Indexing trigger panel */}
          {indexingComplete ? (
            <div className="border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/10 rounded p-6 flex flex-col gap-5 transition-colors duration-200 shadow-sm">
              <div className="flex flex-col gap-1 border-b border-emerald-200/50 dark:border-emerald-900/50 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide font-mono flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      Vector Store Ready
                    </h4>
                    <p className="text-[11px] text-slate-500 font-mono mt-1">Embeddings generated and indexed successfully. You can now use the RAG Query interface to test the pipeline.</p>
                  </div>
                  <div className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 py-1 px-3 rounded text-[10px] font-bold font-mono uppercase border border-emerald-200 dark:border-emerald-800">
                    ✓ Indexed
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-white dark:bg-ink-bg p-4 rounded border border-slate-200 dark:border-border-hairline">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Collection</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono truncate" title={collectionName || 'source_stream'}>{collectionName || 'source_stream'}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Chunks</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">{indexedCount || chunks.length}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Model</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">Gemini</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Vector DB</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">Qdrant</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Time</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">{indexingTime ? `${indexingTime} s` : '---'}</span>
                </div>
              </div>

              <button 
                onClick={() => onNavigate && onNavigate(3)}
                className="w-full bg-accent hover:bg-accent-hover text-white py-3 px-4 rounded text-xs font-semibold font-mono tracking-wide uppercase transition-colors flex justify-center items-center gap-2 mt-2 shadow-sm"
              >
                <span>Continue to RAG Query</span>
                <span className="text-lg leading-none">&rarr;</span>
              </button>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-border-hairline bg-white dark:bg-ink-bg rounded p-6 flex flex-col gap-5 transition-colors duration-200 shadow-sm">
              <div className="flex flex-col gap-1 border-b border-slate-200 dark:border-border-hairline pb-4">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide font-mono">Ready to Index</h4>
                <p className="text-[11px] text-slate-500 font-mono">Review the vector store parameters before generating embeddings.</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-ink-surface p-4 rounded border border-slate-200 dark:border-border-hairline">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Chunks to index</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">{chunks.length}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Embedding Model</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">Gemini</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Vector Database</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">Qdrant</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Collection</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">source_stream</span>
                </div>
              </div>

              {error && (
                <div className="border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3.5 rounded flex items-start gap-2.5 text-xs font-mono">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {loading ? (
                <div className="bg-slate-50 dark:bg-ink-surface border border-slate-200 dark:border-border-hairline p-4 rounded mt-2 flex flex-col gap-4">
                  <div className="flex items-center gap-3 text-accent font-mono text-xs font-bold uppercase tracking-wide">
                    <Loader size={16} className="animate-spin" />
                    <span>Processing Pipeline Active</span>
                  </div>
                  <div className="flex flex-col gap-2.5 pl-7 text-[11px] font-mono">
                    <div className={`flex items-center gap-2.5 ${progressStage >= 0 ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-600'}`}>
                      {progressStage > 0 ? <CheckCircle2 size={14} className="text-emerald-500" /> : progressStage === 0 ? <Loader size={14} className="animate-spin text-accent" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600" />}
                      <span>Preparing chunks for embedding</span>
                    </div>
                    <div className={`flex items-center gap-2.5 ${progressStage >= 1 ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-600'}`}>
                      {progressStage > 1 ? <CheckCircle2 size={14} className="text-emerald-500" /> : progressStage === 1 ? <Loader size={14} className="animate-spin text-accent" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600" />}
                      <span>Generating high-dimensional embeddings (Gemini)</span>
                    </div>
                    <div className={`flex items-center gap-2.5 ${progressStage >= 2 ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-600'}`}>
                      {progressStage > 2 ? <CheckCircle2 size={14} className="text-emerald-500" /> : progressStage === 2 ? <Loader size={14} className="animate-spin text-accent" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600" />}
                      <span>Uploading vectors to Qdrant</span>
                    </div>
                    <div className={`flex items-center gap-2.5 ${progressStage >= 3 ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-600'}`}>
                      {progressStage > 3 ? <CheckCircle2 size={14} className="text-emerald-500" /> : progressStage === 3 ? <Loader size={14} className="animate-spin text-accent" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600" />}
                      <span>Finalizing collection</span>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  className="w-full bg-accent hover:bg-accent-hover text-white py-3 px-4 rounded text-xs font-semibold font-mono tracking-wide uppercase transition-colors disabled:opacity-40 flex justify-center items-center gap-2 mt-2"
                  disabled={loading}
                  onClick={handleIndex}
                >
                  <span>Generate Embeddings & Index</span>
                </button>
              )}
            </div>
          )}

          {indexingComplete && (
            <details className="mt-6 border border-slate-200 dark:border-slate-800 rounded group bg-slate-50/50 dark:bg-[#0a0c10]/50 transition-colors duration-200">
              <summary className="flex items-center justify-between p-3 cursor-pointer list-none text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <div className="flex items-center gap-2.5">
                  <Database size={14} />
                  <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Developer Diagnostics</span>
                  <span className="text-[9px] font-mono bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">Advanced Tool</span>
                </div>
                <ChevronDown size={14} className="group-open:rotate-180 transition-transform" />
              </summary>
              
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-ink-bg flex flex-col gap-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 mb-1.5 font-mono uppercase tracking-wider">
                    <Search size={14} className="text-slate-500" />
                    <span>Test Similarity Retrieval</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono">Run direct nearest-neighbor searches against the vector database to evaluate embedding precision.</p>
                </div>

                <form onSubmit={handleSearch} className="flex flex-col gap-3 bg-slate-50 dark:bg-[#0a0c10] border border-slate-200 dark:border-slate-800 p-3 rounded font-mono">
                  <div className="flex gap-3 flex-wrap">
                    <div className="flex-grow min-w-[200px] flex flex-col gap-1.5">
                      <label htmlFor="search-input" className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Query String</label>
                      <input
                        id="search-input"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Enter keywords or questions..."
                        className="bg-white dark:bg-ink-bg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] px-3 py-1.5 rounded focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 w-full transition-colors duration-200"
                        required
                      />
                    </div>
                    <div className="w-[80px] flex flex-col gap-1.5">
                      <label htmlFor="search-k" className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Top-K</label>
                      <input
                        id="search-k"
                        type="number"
                        min="1"
                        max="20"
                        value={searchK}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === '') {
                            setSearchK('')
                          } else {
                            const parsed = parseInt(val, 10)
                            if (!isNaN(parsed)) setSearchK(parsed)
                          }
                        }}
                        onBlur={(e) => {
                          let val = parseInt(e.target.value, 10)
                          if (isNaN(val) || val < 1) val = 1
                          if (val > 20) val = 20
                          setSearchK(val)
                        }}
                        className="bg-white dark:bg-ink-bg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] px-3 py-1.5 rounded focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 w-full text-center transition-colors duration-200"
                      />
                    </div>
                  </div>

                  {searchError && (
                    <div className="border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-2.5 rounded flex items-start gap-2 text-[10px]">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      <span>{searchError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-1.5 px-3 rounded text-[11px] font-bold uppercase transition-colors disabled:opacity-40 flex justify-center items-center gap-2 mt-1"
                    disabled={searching}
                  >
                    {searching ? (
                      <>
                        <Loader size={12} className="animate-spin" />
                        <span>Querying DB...</span>
                      </>
                    ) : (
                      <>
                        <Search size={12} />
                        <span>Execute Search</span>
                      </>
                    )}
                  </button>
                </form>

                {searchResults && (
                  <div className="flex flex-col gap-2 mt-2">
                    <h4 className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider mb-1">Retrieval Results</h4>
                    {searchResults.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-[11px] font-mono border border-dashed border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-[#0a0c10]">
                        No semantic matches found.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {searchResults.map((result, idx) => (
                          <div key={idx} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0c10] rounded text-[11px] font-mono overflow-hidden">
                            <div 
                              className="bg-slate-50 dark:bg-ink-surface p-2.5 flex justify-between items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                              onClick={() => toggleExpandResult(idx)}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] font-bold px-1.5 py-0.5 rounded">#{idx + 1}</span>
                                <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px]" title={result.metadata?.source || 'Unknown'}>
                                  {result.metadata?.source ? result.metadata.source.split(/[/\\]/).pop() : 'Unknown'}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[9px] text-slate-400 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded font-bold border border-slate-200 dark:border-slate-800">Score: {result.score.toFixed(4)}</span>
                                {expandedResultIndex === idx ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                              </div>
                            </div>
                            
                            {expandedResultIndex === idx && (
                              <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-ink-bg">
                                <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed max-h-[150px] overflow-y-auto custom-scrollbar">
                                  {result.page_content}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

export default VectorStore
