import React, { useState, useEffect } from 'react'
import { Layers, FileText, Database, Cpu } from 'lucide-react'
import DocumentLoader from './components/DocumentLoader'
import TextSplitter from './components/TextSplitter'
import VectorStore from './components/VectorStore'
import ChatInterface from './components/ChatInterface'

function App() {
  const [status, setStatus] = useState('checking')
  const [serverInfo, setServerInfo] = useState(null)
  const [loadedDocuments, setLoadedDocuments] = useState(null)
  const [splitChunks, setSplitChunks] = useState(null)
  const [isIndexed, setIsIndexed] = useState(false)

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
    checkHealth()
    const interval = setInterval(checkHealth, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="dashboard-container">
      <header className="header">
        <h1>Source Stream</h1>
        <p>
          An enterprise-grade, high-performance RAG pipeline that enables indexing local PDFs and documentation websites into a searchable knowledge base.
        </p>
      </header>

      <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Pipeline Status</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Monitoring backend connection and state.
            </p>
          </div>
          <div className={`status-badge ${status}`}>
            <span className="pulse-dot"></span>
            {status === 'online' ? 'Online' : status === 'offline' ? 'Offline' : 'Checking...'}
          </div>
        </div>

        {status === 'online' && serverInfo && (
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
              <strong>Uptime:</strong> {serverInfo.uptime_seconds}s | <strong>Server Time:</strong> {serverInfo.timestamp}
            </p>
          </div>
        )}
      </section>

      <section className="glass-card">
        <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', fontFamily: 'Outfit' }}>1. Ingest Knowledge Source</h2>
        <DocumentLoader onDocumentsLoaded={(docs) => {
          setLoadedDocuments(docs)
          setSplitChunks(null)
          setIsIndexed(false)
        }} />
      </section>

      <section className="glass-card">
        <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', fontFamily: 'Outfit' }}>2. Text Chunking</h2>
        <TextSplitter 
          documents={loadedDocuments}
          chunks={splitChunks}
          onChunksGenerated={(chunks) => {
            setSplitChunks(chunks)
            setIsIndexed(false)
          }}
        />
      </section>

      <section className="glass-card">
        <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', fontFamily: 'Outfit' }}>3. Vector Database Indexing</h2>
        <VectorStore chunks={splitChunks} onIndexingComplete={setIsIndexed} />
      </section>

      <section className="glass-card">
        <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', fontFamily: 'Outfit' }}>4. RAG Query & Chat</h2>
        {isIndexed ? (
          <ChatInterface />
        ) : (
          <div className="drop-zone" style={{ borderStyle: 'solid', cursor: 'default', opacity: 0.6 }}>
            <Cpu size={40} className="cloud-icon" />
            <p style={{ color: 'var(--text-secondary)' }}>
              Please index your document chunks into the vector store to enable interactive RAG Chat.
            </p>
          </div>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '2rem', textAlign: 'center', fontFamily: 'Outfit' }}>System Capabilities</h2>
        <div className="grid-features">
          <div className="feature-item">
            <div className="feature-icon"><FileText size={24} /></div>
            <h3>PDF Ingestion</h3>
            <p>Chunk and process unstructured text from complex local PDF documents.</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon"><Layers size={24} /></div>
            <h3>Website Scraper</h3>
            <p>Direct website spidering to pull clean markdown and documents from documentation hubs.</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon"><Database size={24} /></div>
            <h3>Qdrant Storage</h3>
            <p>Store Gemini Embeddings with exact vector parameters in a secure cloud store.</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon"><Cpu size={24} /></div>
            <h3>RAG Engine</h3>
            <p>Synthesize grounded answers using Groq API LLM with citations and metadata verification.</p>
          </div>
        </div>
      </section>

      <footer>
        <p>&copy; 2026 Source Stream. All systems operational.</p>
      </footer>
    </div>
  )
}

export default App
