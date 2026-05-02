import React, { useState, useRef, useEffect } from 'react'
import { Send, X, BookOpen, FileText, Sparkles, ExternalLink, Info, Lock } from 'lucide-react'
import { getSessionId } from '../utils/session'

function ChatInterface({ isIndexed, onNavigate }) {
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

  const handleSend = async (textToSend) => {
    const userMessageText = textToSend || input.trim()
    if (!userMessageText || isLoading) return
    
    setInput('')
    setError(null)
    
    const userMsgId = `user-${Date.now()}`
    const userTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    
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
          'X-Session-Id': getSessionId()
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
    
    if (src.includes('/') || src.includes('\\')) {
      const parts = src.split(/[/\\]/)
      return `${parts[parts.length - 1]}${page}`
    }
    return `${src}${page}`
  }

  // Pre-configured quick prompts for developers
  const quickPrompts = [
    'Summarize the context',
    'What are the key technical details?',
    'Identify any limitations or risks'
  ]

  return (
    <div className="flex flex-col md:flex-row gap-4 font-sans text-sm relative min-h-[480px]">
      
      {!isIndexed ? (
        <div className="flex-grow border border-slate-200 dark:border-border-hairline bg-slate-50 dark:bg-ink-bg p-12 flex flex-col items-center justify-center text-center rounded gap-4 transition-colors duration-200 min-h-[420px]">
          <div className="bg-slate-200 dark:bg-[#0a0c10] border border-slate-300 dark:border-border-hairline p-3 rounded-full">
            <Lock size={28} className="text-slate-500 dark:text-slate-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono uppercase tracking-wider mb-1">Stage Locked</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">Please index document chunks into the Vector Store before initiating queries.</p>
          </div>
          <button 
            onClick={() => onNavigate && onNavigate(2)}
            className="mt-2 bg-accent hover:bg-accent-hover text-white py-2 px-5 rounded text-xs font-semibold font-mono tracking-wide uppercase transition-colors"
          >
            Go to Vector Store
          </button>
        </div>
      ) : (
        <>
          {/* Main Chat Area */}
          <div className="flex-grow flex flex-col justify-between border border-slate-200 dark:border-border-hairline bg-white dark:bg-ink-bg p-4 rounded min-h-[420px] max-h-[500px] transition-colors duration-200">
        {/* Messages List */}
        <div className="flex-grow overflow-y-auto pr-1 flex flex-col gap-3.5 mb-4 max-h-[380px]">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col gap-1 ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div 
                className={`px-3.5 py-2 rounded text-slate-800 dark:text-slate-100 font-sans max-w-[85%] border leading-relaxed transition-colors duration-200 ${
                  msg.role === 'user' 
                    ? 'bg-slate-100 dark:bg-ink-hover border-slate-200 dark:border-border-hairline text-right' 
                    : msg.isError 
                      ? 'bg-red-50 dark:bg-red-950/15 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-mono text-xs' 
                      : 'bg-slate-50 dark:bg-ink-surface border-slate-200 dark:border-border-hairline'
                }`}
              >
                <div>{msg.content}</div>
                
                {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                  <div className="border-t border-slate-200 dark:border-border-hairline/60 mt-2.5 pt-2 flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                      <BookOpen size={10} /> Sources used:
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                      {msg.sources.map((source, idx) => (
                        <button
                          key={idx}
                          className="font-mono text-[10px] bg-white dark:bg-[#0a0c10] border border-slate-200 dark:border-border-hairline text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-ink-hover hover:border-accent/40 dark:hover:border-accent/40 px-2 py-0.5 rounded transition-all"
                          onClick={() => openCitationsDrawer(msg.sources, idx)}
                        >
                          [{idx + 1}] {formatSourceLabel(source.metadata)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <span className="text-[9px] font-mono text-slate-500 px-1.5">{msg.timestamp}</span>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex flex-col items-start gap-1">
              <div className="bg-slate-50 dark:bg-ink-surface border border-slate-200 dark:border-border-hairline px-3.5 py-2.5 rounded text-slate-500 dark:text-slate-400 flex items-center gap-2 max-w-[85%] transition-colors duration-200">
                <Sparkles size={13} className="animate-pulse text-accent" />
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-600 rounded-full animate-bounce delay-75" />
                  <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-600 rounded-full animate-bounce delay-150" />
                  <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-600 rounded-full animate-bounce delay-225" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area & Quick Prompts */}
        <div className="flex flex-col gap-3">
          {/* Quick Prompts Suggestions (Visible when message logs have only welcome message) */}
          {messages.length === 1 && !isLoading && (
            <div className="flex flex-wrap gap-1.5 border-b border-slate-200 dark:border-border-hairline pb-3.5 transition-colors duration-200">
              {quickPrompts.map((promptText, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(promptText)}
                  className="font-mono text-[10px] bg-slate-50 dark:bg-[#0a0c10] border border-slate-200 dark:border-border-hairline text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-accent/40 dark:hover:border-accent/40 px-2.5 py-1 rounded transition-all text-left"
                >
                  {promptText}
                </button>
              ))}
            </div>
          )}

          {/* Form input */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
            className="flex gap-2 bg-slate-50 dark:bg-[#0a0c10] border border-slate-200 dark:border-border-hairline p-1 rounded transition-colors duration-200"
          >
            <input
              type="text"
              className="flex-grow bg-slate-50 dark:bg-[#0a0c10] text-xs font-mono text-slate-800 dark:text-slate-200 px-3 py-2 focus:outline-none focus:border-accent rounded w-full border border-transparent transition-colors duration-200"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your indexed knowledge..."
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className="bg-accent hover:bg-accent-hover text-white p-2 rounded text-xs transition-colors shrink-0 disabled:opacity-40 flex items-center justify-center w-8 h-8"
              disabled={isLoading || !input.trim()}
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>

      {/* Citations Side Drawer (Absolute overlay inside relative container for neat visual framing) */}
      {isDrawerOpen && (
        <div className="absolute md:relative top-0 right-0 h-full w-full md:w-[320px] bg-white dark:bg-ink-surface border border-slate-200 dark:border-border-hairline md:border-l-0 rounded z-10 flex flex-col shrink-0 transition-colors duration-200">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-border-hairline px-4 py-3 bg-slate-50 dark:bg-[#0a0c10]">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-mono uppercase tracking-wider">
              <BookOpen size={13} className="text-accent" />
              <span>Citations ({activeSources.length})</span>
            </h3>
            <button className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1" onClick={() => setIsDrawerOpen(false)}>
              <X size={16} />
            </button>
          </div>
          
          <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-3">
            {activeSources.map((source, idx) => {
              const isHighlighted = idx === highlightedSourceIdx
              return (
                <div 
                  key={idx} 
                  className={`border p-3 rounded flex flex-col gap-1.5 bg-slate-50 dark:bg-[#0a0c10] transition-colors duration-200 ${
                    isHighlighted ? 'border-accent' : 'border-slate-200 dark:border-border-hairline'
                  }`}
                >
                  <div className="flex justify-between items-center gap-2">
                    <span className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-slate-800 dark:text-slate-200">
                      <span className="text-accent font-bold">[{idx + 1}]</span>
                      {source.metadata.source?.startsWith('http') ? (
                        <a 
                          href={source.metadata.source} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-slate-600 dark:text-slate-300 hover:text-accent dark:hover:text-accent flex items-center gap-1"
                        >
                          Link <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span className="flex items-center gap-1 truncate max-w-[120px]">
                          <FileText size={10} className="text-slate-500 dark:text-slate-400 shrink-0" />
                          {source.metadata.source ? source.metadata.source.split(/[/\\]/).pop() : 'doc'}
                        </span>
                      )}
                    </span>
                    {source.score !== undefined && (
                      <span className="font-mono text-[9px] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-border-hairline px-1 rounded bg-white dark:bg-ink-hover">
                        {(source.score * 100).toFixed(0)}% match
                      </span>
                    )}
                  </div>

                  {source.metadata.page !== undefined && source.metadata.page !== null && (
                    <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      <strong>Page:</strong> {parseInt(source.metadata.page) + 1}
                    </div>
                  )}

                  <div className="flex flex-col gap-1 border-t border-slate-200 dark:border-border-hairline/45 pt-1.5">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      <Info size={10} /> Context chunk
                    </span>
                    <div className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300 bg-white dark:bg-[#0a0c10] border border-slate-200 dark:border-border-hairline/60 p-2 rounded max-h-[120px] overflow-y-auto select-all font-sans">
                      {source.page_content}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}

export default ChatInterface
