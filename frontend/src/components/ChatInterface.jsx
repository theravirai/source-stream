import React, { useState, useRef, useEffect } from 'react'
import { Send, X, BookOpen, FileText, Sparkles, ExternalLink, Info } from 'lucide-react'

function ChatInterface() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your Source Stream assistant. I can answer questions using strictly the context of your uploaded files or crawled website pages. Ask me anything!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sources: []
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [activeSources, setActiveSources] = useState([])
  const [highlightedSourceIdx, setHighlightedSourceIdx] = useState(null)

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessageText = input.trim()
    setInput('')
    setError(null)
    
    const userMsgId = `user-${Date.now()}`
    const userTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    
    // Add user message to log
    setMessages(prev => [...prev, {
      id: userMsgId,
      role: 'user',
      content: userMessageText,
      timestamp: userTimestamp
    }])
    
    setIsLoading(true)

    try {
      const response = await fetch('/api/v1/retriever/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessageText,
          k: 4
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to synthesize response')
      }

      const data = await response.json()
      
      const assistantMsgId = `assistant-${Date.now()}`
      const assistantTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      setMessages(prev => [...prev, {
        id: assistantMsgId,
        role: 'assistant',
        content: data.answer,
        timestamp: assistantTimestamp,
        sources: data.source_documents || []
      }])
    } catch (err) {
      setError(err.message)
      // Append error message to chat
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${err.message}. Please check that GROQ_API_KEY is configured in your backend environment.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const openCitationsDrawer = (sources, highlightIdx = null) => {
    setActiveSources(sources)
    setHighlightedSourceIdx(highlightIdx)
    setIsDrawerOpen(true)
  }

  const formatSourceLabel = (metadata) => {
    const src = metadata.source || 'Unknown Source'
    const page = metadata.page !== undefined && metadata.page !== null ? ` (Page ${parseInt(metadata.page) + 1})` : ''
    
    // If it is a local temporary file path, extract the filename
    if (src.includes('/') || src.includes('\\')) {
      const parts = src.split(/[/\\]/)
      return `${parts[parts.length - 1]}${page}`
    }
    return `${src}${page}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-message ${msg.role}`}>
              <div className="message-bubble" style={msg.isError ? { border: '1px solid var(--color-error)', background: 'rgba(239, 68, 68, 0.05)' } : {}}>
                {msg.content}
                
                {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                  <div className="citations-container">
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', width: '100%', marginBottom: '0.2rem' }}>
                      <BookOpen size={12} /> Sources used:
                    </span>
                    {msg.sources.map((source, idx) => (
                      <button
                        key={idx}
                        className="citation-tag"
                        onClick={() => openCitationsDrawer(msg.sources, idx)}
                      >
                        [{idx + 1}] {formatSourceLabel(source.metadata)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span className="message-meta">{msg.timestamp}</span>
            </div>
          ))}
          
          {isLoading && (
            <div className="chat-message assistant">
              <div className="message-bubble" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} className="spinner" style={{ color: 'var(--color-accent)' }} />
                <div className="typing-indicator">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="chat-input-wrapper">
          <input
            type="text"
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your indexed knowledge..."
            disabled={isLoading}
          />
          <button 
            type="submit" 
            className="chat-send-btn"
            disabled={isLoading || !input.trim()}
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* Citations Side Drawer */}
      <div className={`citations-drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={20} style={{ color: 'var(--color-accent)' }} />
            Retrieved Citations ({activeSources.length})
          </h3>
          <button className="drawer-close-btn" onClick={() => setIsDrawerOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <div className="drawer-body">
          {activeSources.map((source, idx) => {
            const isHighlighted = idx === highlightedSourceIdx
            return (
              <div 
                key={idx} 
                className="citation-detail-card"
                style={isHighlighted ? { borderColor: 'var(--border-focus)', background: 'rgba(99, 102, 241, 0.03)' } : {}}
              >
                <div className="citation-detail-meta">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                    <span className="doc-index-badge">[{idx + 1}]</span>
                    {source.metadata.source?.startsWith('http') ? (
                      <a 
                        href={source.metadata.source} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none' }}
                      >
                        Website Source <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FileText size={14} style={{ color: 'var(--text-secondary)' }} />
                        {source.metadata.source ? source.metadata.source.split(/[/\\]/).pop() : 'Document'}
                      </span>
                    )}
                  </span>
                  {source.score !== undefined && (
                    <span className="citation-detail-score">
                      {(source.score * 100).toFixed(0)}% match
                    </span>
                  )}
                </div>

                {source.metadata.page !== undefined && source.metadata.page !== null && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <strong>Page:</strong> {parseInt(source.metadata.page) + 1}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Info size={12} /> Context Snippet
                  </span>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    lineHeight: '1.5', 
                    color: 'var(--text-primary)', 
                    background: 'rgba(0, 0, 0, 0.2)', 
                    border: '1px solid var(--border-glass)',
                    padding: '0.75rem', 
                    borderRadius: '8px',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {source.page_content}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ChatInterface
