import React, { useState, useEffect } from 'react'
import { Server, RotateCcw, AlertTriangle, Sun, Moon } from 'lucide-react'
import PipelineRail from './components/PipelineRail'
import DocumentLoader from './components/DocumentLoader'
import TextSplitter from './components/TextSplitter'
import VectorStore from './components/VectorStore'
import ChatInterface from './components/ChatInterface'
import { getSessionId } from './utils/session'

function App() {
  const sessionId = getSessionId()
  const [activeStep, setActiveStep] = useState(0)
  const [status, setStatus] = useState('checking')
  const [serverInfo, setServerInfo] = useState(null)
  
  // Theme State
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark'
  })

  useEffect(() => {
    localStorage.setItem('theme', theme)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  // Pipeline Data States
  const [loadedDocuments, setLoadedDocuments] = useState(null)
  const [splitChunks, setSplitChunks] = useState(null)
  const [isIndexed, setIsIndexed] = useState(false)
  const [vectorSearchState, setVectorSearchState] = useState(null)
  const [ragSessionState, setRagSessionState] = useState(null)
  const [qdrantStats, setQdrantStats] = useState({ chunks_count: 0, status: 'unknown' })
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)

  // Fetch Backend health & Qdrant stats at boot
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/v1/health')
        if (response.ok) {
          const data = await response.json()
          setServerInfo(data)
          setStatus('online')
        } else {
          setStatus('offline')
        }
      } catch (err) {
        setStatus('offline')
      }
    }

    const checkVectorStoreStatus = async () => {
      try {
        const response = await fetch('/api/v1/vector-store/status', {
          headers: { 'X-Session-Id': sessionId }
        })
        if (response.ok) {
          const data = await response.json()
          setQdrantStats({
            chunks_count: data.chunks_count,
            status: data.status
          })
          if (data.chunks_count > 0) {
            setIsIndexed(true)
            // Auto-switch to RAG Query if already indexed
            setActiveStep(3)
          }
        }
      } catch (err) {
        console.error('Failed to fetch Qdrant status:', err)
      } finally {
        setIsLoadingStatus(false)
      }
    }

    checkHealth()
    checkVectorStoreStatus()
    const interval = setInterval(checkHealth, 15000)
    return () => clearInterval(interval)
  }, [])

  // Dynamic rail steps configuration
  const steps = [
    {
      title: 'Document Loader',
      status: loadedDocuments ? 'done' : activeStep === 0 ? 'active' : 'idle',
      summary: loadedDocuments ? `${loadedDocuments.length} docs loaded` : 'Upload or crawl source'
    },
    {
      title: 'Text Splitter',
      status: splitChunks ? 'done' : activeStep === 1 ? 'active' : 'idle',
      summary: splitChunks 
        ? `${splitChunks.length} chunks · overlap ${splitChunks[0]?.metadata?.overlap || 200}`
        : loadedDocuments ? 'Ready to split' : 'Requires documents'
    },
    {
      title: 'Vector Store',
      status: isIndexed ? 'done' : activeStep === 2 ? 'active' : 'idle',
      summary: isIndexed
        ? `${qdrantStats.chunks_count || splitChunks?.length || 0} chunks indexed`
        : splitChunks ? 'Ready to index' : 'Requires chunks'
    },
    {
      title: 'RAG Query',
      status: isIndexed ? 'done' : activeStep === 3 ? 'active' : 'idle',
      summary: isIndexed ? 'Playground active' : 'Requires vector index'
    }
  ]

  // Clear/Reset entire pipeline
  const handleResetPipeline = async () => {
    if (!window.confirm('Are you sure you want to clear the knowledge base? This will delete all indexed vectors in Qdrant.')) {
      return
    }

    try {
      const response = await fetch('/api/v1/vector-store/clear', {
        method: 'POST',
        headers: { 'X-Session-Id': sessionId }
      })
      if (response.ok) {
        setLoadedDocuments(null)
        setSplitChunks(null)
        setIsIndexed(false)
        setQdrantStats({ chunks_count: 0, status: 'not_created' })
        setActiveStep(0)
      } else {
        alert('Failed to clear database collection.')
      }
    } catch (err) {
      alert('Error connecting to backend to reset collection.')
    }
  }

  const earliestIncompleteStep = (!loadedDocuments || loadedDocuments.length === 0) ? 0 
    : (!splitChunks || splitChunks.length === 0) ? 1 
    : !isIndexed ? 2 : 3;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-ink-bg text-slate-900 dark:text-slate-50 font-sans flex flex-col antialiased transition-colors duration-200">
      {/* Top Header */}
      <header className="border-b border-slate-200 dark:border-border-hairline bg-white dark:bg-ink-surface px-6 py-4 flex flex-wrap justify-between items-center gap-4 transition-colors duration-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-accent tracking-tight text-lg">SOURCE STREAM</span>
            <span className="text-[10px] font-mono border border-slate-200 dark:border-border-hairline px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">RAG DEVTOOL</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">Precision retrieval-augmented generation engine validation workspace.</p>
        </div>

        {/* Health status badge & Quick controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-border-hairline bg-slate-50 dark:bg-ink-bg p-1.5 rounded transition-colors duration-200"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            onClick={handleResetPipeline}
            className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 border border-slate-200 dark:border-border-hairline hover:border-red-500/50 dark:hover:border-red-900/50 bg-slate-50 dark:bg-ink-bg px-2.5 py-1.5 rounded transition-all font-mono duration-200"
            title="Wipe database and reset pipeline"
          >
            <RotateCcw size={12} />
            <span>Reset knowledge base</span>
          </button>
          
          <div className="flex items-center gap-2 border border-slate-200 dark:border-border-hairline bg-slate-50 dark:bg-ink-bg px-2.5 py-1.5 rounded text-xs font-mono transition-colors duration-200">
            <Server size={12} className={status === 'online' ? 'text-emerald-500' : 'text-red-500'} />
            <span className="text-slate-500 dark:text-slate-400">API:</span>
            <span className={status === 'online' ? 'text-emerald-500' : 'text-red-500'}>
              {status === 'online' ? 'online' : status === 'offline' ? 'offline' : 'checking'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 flex-grow flex flex-col gap-6">
        
        {/* Persistent Pipeline Rail */}
        <PipelineRail 
          activeStep={activeStep} 
          setActiveStep={setActiveStep} 
          steps={steps} 
          earliestIncompleteStep={earliestIncompleteStep} 
        />

        {/* Active Stage Panel */}
        <div className="border border-slate-200 dark:border-border-hairline bg-white dark:bg-ink-surface p-4 md:p-6 flex-grow flex flex-col justify-between transition-colors duration-200 rounded-md">
          
          {/* Active View Container */}
          <div className="flex-grow">
            <>
              {activeStep === 0 && (
              <DocumentLoader 
                onDocumentsLoaded={(docs) => {
                  setLoadedDocuments(docs)
                  setSplitChunks(null)
                  setIsIndexed(false)
                  setVectorSearchState(null)
                  setRagSessionState(null)
                  setQdrantStats({ chunks_count: 0, status: 'not_created' })
                }}
                onNavigate={(step) => setActiveStep(step)}
              />
            )}

            {activeStep === 1 && (
              <TextSplitter 
                documents={loadedDocuments}
                chunks={splitChunks}
                onChunksGenerated={(chunks) => {
                  setSplitChunks(chunks)
                  setIsIndexed(false)
                  setVectorSearchState(null)
                  setRagSessionState(null)
                }}
                onNavigate={(step) => setActiveStep(step)}
              />
            )}

            {activeStep === 2 && (
              <VectorStore 
                chunks={splitChunks} 
                isIndexed={isIndexed}
                earliestIncompleteStep={earliestIncompleteStep}
                vectorSearchState={vectorSearchState}
                setVectorSearchState={setVectorSearchState}
                onIndexingComplete={(complete) => {
                  setIsIndexed(complete)
                  setVectorSearchState(null)
                  setRagSessionState(null)
                  // Refresh Qdrant stats
                  fetch('/api/v1/vector-store/status', {
                    headers: { 'X-Session-Id': sessionId }
                  })
                    .then(res => res.json())
                    .then(data => setQdrantStats({ chunks_count: data.chunks_count, status: data.status }))
                    .catch(err => console.error(err))
                }}
                onNavigate={(step) => setActiveStep(step)}
              />
            )}

            {activeStep === 3 && (
              <ChatInterface 
                isIndexed={isIndexed}
                earliestIncompleteStep={earliestIncompleteStep}
                ragSessionState={ragSessionState}
                setRagSessionState={setRagSessionState}
                onNavigate={(step) => setActiveStep(step)}
              />
            )}
            </>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-border-hairline bg-white dark:bg-ink-surface px-6 py-4 flex flex-wrap justify-between items-center text-xs font-mono text-slate-500 dark:text-slate-400 transition-colors duration-200">
        <div>&copy; 2026 Source Stream. All systems operational.</div>
        <div className="flex gap-4">
          <span>Qdrant Collection: {qdrantStats.collection_name || 'source_stream'}</span>
          <span>Chunks Count: {qdrantStats.chunks_count}</span>
        </div>
      </footer>
    </div>
  )
}

export default App
