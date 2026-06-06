import React, { useState, useRef, useEffect } from 'react'
import { Send, X, BookOpen, FileText, Sparkles, ExternalLink, Info, Lock, ShieldAlert, Activity, CheckCircle2, AlertCircle, XCircle, ChevronDown, ChevronRight, Clock, Zap, ShieldCheck, AlertTriangle, MinusCircle } from 'lucide-react'
import { getSessionId } from '../utils/session'

const TelemetryStepView = ({ step, idx, isLast }) => {
  const [expanded, setExpanded] = useState(false)
  const isFailed = step.details?.status === 'FAILED' || step.details?.status === 'BLOCKED'
  const isWarning = (step.name === 'Document Search' && step.details?.citations_selected === 0) || step.details?.status === 'WARNING' || step.details?.status === 'OUT-OF-SCOPE'
  const isSkipped = step.details?.status === 'SKIPPED'
  
  const StatusIcon = isFailed ? XCircle : isWarning ? AlertTriangle : isSkipped ? MinusCircle : CheckCircle2
  const statusColor = isFailed ? 'text-red-500' : isWarning ? 'text-amber-500' : isSkipped ? 'text-slate-400 dark:text-slate-500' : 'text-emerald-500'
  
  // Animation delay
  const style = { animationDelay: `${idx * 150}ms`, animationFillMode: 'both' }
  
  const extraDetails = Object.entries(step.details || {}).filter(([k]) => k !== 'status' && k !== 'reason')
  const hasExtraDetails = extraDetails.length > 0
  
  return (
    <div className="flex relative animate-fade-in-up" style={style}>
      <div className="absolute left-[11px] top-6 bottom-[-16px] w-[1.5px] bg-slate-200 dark:bg-slate-800 z-0" style={{ display: idx === 6 ? 'none' : 'block' }}></div>
      
      <div className={`w-6 h-6 rounded-full bg-slate-50 dark:bg-[#0a0c10] flex items-center justify-center shrink-0 z-10 ${statusColor} mt-0.5 ring-4 ring-white dark:ring-ink-surface`}>
        <StatusIcon size={14} />
      </div>
      
      <div className="flex flex-col flex-grow ml-3 mb-5">
        <div 
          className={`flex justify-between items-center group ${hasExtraDetails ? 'cursor-pointer' : ''}`}
          onClick={() => hasExtraDetails && setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold text-slate-800 dark:text-slate-200 tracking-wide">{step.name}</span>
            {step.details?.status && (
              <span className={`text-[9px] font-mono px-1.5 py-[2px] rounded uppercase font-semibold tracking-wider ${
                isFailed ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-900/50' :
                isWarning ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50' :
                isSkipped ? 'bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50' :
                'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30'
              }`}>
                {step.details.status}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
            <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800/50 px-1.5 py-0.5 rounded">{step.duration_ms.toFixed(1)}ms</span>
            {hasExtraDetails && (
              <div className="w-4 h-4 flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-slate-700">
                {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} className="opacity-40 group-hover:opacity-100 transition-opacity" />}
              </div>
            )}
          </div>
        </div>
        
        {step.details?.reason && (
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">
            {step.details.reason}
          </div>
        )}
        
        {expanded && hasExtraDetails && (
          <div className="mt-2.5 text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-[#0a0c10] p-2.5 rounded flex flex-col gap-1.5 border border-slate-200 dark:border-slate-800/80">
             {extraDetails.map(([k, v]) => (
               <div key={k} className="flex justify-between items-center border-b border-slate-200/50 dark:border-slate-800/50 last:border-0 pb-1.5 last:pb-0">
                 <span className="opacity-70">{k.replace(/_/g, ' ')}</span>
                 <span className="font-semibold text-slate-800 dark:text-slate-300">{String(v)}</span>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ChatInterface({ isIndexed, earliestIncompleteStep, ragSessionState, setRagSessionState, onNavigate }) {
  const [messages, setMessages] = useState(ragSessionState?.messages || [
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your Source Stream assistant. I can answer questions using strictly the context of your uploaded files or crawled website pages. Ask me anything!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sources: []
    }
  ])
  const [input, setInput] = useState(ragSessionState?.input || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(ragSessionState?.isDrawerOpen || false)
  const [activeSources, setActiveSources] = useState(ragSessionState?.activeSources || [])
  const [highlightedSourceIdx, setHighlightedSourceIdx] = useState(ragSessionState?.highlightedSourceIdx || null)
  
  const [isTelemetryDrawerOpen, setIsTelemetryDrawerOpen] = useState(ragSessionState?.isTelemetryDrawerOpen || false)
  const [activeTelemetry, setActiveTelemetry] = useState(ragSessionState?.activeTelemetry || null)
  const [activeTelemetryMsgId, setActiveTelemetryMsgId] = useState(ragSessionState?.activeTelemetryMsgId || null)

  const stateRef = useRef({ messages, input, isDrawerOpen, activeSources, highlightedSourceIdx, isTelemetryDrawerOpen, activeTelemetry, activeTelemetryMsgId })
  useEffect(() => {
    stateRef.current = { messages, input, isDrawerOpen, activeSources, highlightedSourceIdx, isTelemetryDrawerOpen, activeTelemetry, activeTelemetryMsgId }
  }, [messages, input, isDrawerOpen, activeSources, highlightedSourceIdx, isTelemetryDrawerOpen, activeTelemetry, activeTelemetryMsgId])

  useEffect(() => {
    return () => {
      if (setRagSessionState) {
        setRagSessionState(stateRef.current)
      }
    }
  }, [setRagSessionState])

  const chatContainerRef = useRef(null)
  const prevMessagesLength = useRef(messages.length)

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      // Use requestAnimationFrame to ensure DOM has updated before scrolling
      requestAnimationFrame(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
      })
    }
  }

  useEffect(() => {
    if (messages.length !== prevMessagesLength.current) {
      scrollToBottom()
      prevMessagesLength.current = messages.length
    }
  }, [messages.length])
  
  useEffect(() => {
    if (isLoading) {
      scrollToBottom()
    }
  }, [isLoading])

  const handleSend = async (textToSend) => {
    const userMessageText = textToSend || input.trim()
    if (!userMessageText || isLoading) return
    
    setInput('')
    setError(null)
    
    const userMsgId = `user-${Date.now()}`
    const assistantMsgId = `assistant-${Date.now()}`
    const userTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    
    setMessages(prev => [...prev, {
      id: userMsgId,
      role: 'user',
      content: userMessageText,
      timestamp: userTimestamp
    }])
    
    setIsLoading(true)
    
    setIsTelemetryDrawerOpen(prevOpen => {
      if (prevOpen) {
        setActiveTelemetryMsgId(assistantMsgId)
        setActiveTelemetry(null)
      }
      return prevOpen
    })

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
      
      const assistantTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      setMessages(prev => [...prev, {
        id: assistantMsgId,
        role: 'assistant',
        content: data.answer,
        timestamp: assistantTimestamp,
        sources: data.source_documents || [],
        candidates: data.retrieved_candidates || [],
        guardrailBlocked: data.guardrail_blocked || false,
        guardrailReason: data.guardrail_reason || null,
        telemetry: data.telemetry || null
      }])
      
      setActiveTelemetryMsgId(currentId => {
        if (currentId === assistantMsgId) {
          setActiveTelemetry(data.telemetry || null)
        }
        return currentId
      })
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
    setIsTelemetryDrawerOpen(false)
    setActiveSources(sources)
    setHighlightedSourceIdx(highlightIdx)
    setIsDrawerOpen(true)
  }

  const openTelemetryDrawer = (msgId, telemetry) => {
    setIsDrawerOpen(false)
    setActiveTelemetry(telemetry)
    setActiveTelemetryMsgId(msgId)
    setIsTelemetryDrawerOpen(true)
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
            onClick={() => onNavigate && onNavigate(earliestIncompleteStep !== undefined ? earliestIncompleteStep : 2)}
            className="mt-2 bg-accent hover:bg-accent-hover text-white py-2 px-5 rounded text-xs font-semibold font-mono tracking-wide uppercase transition-colors"
          >
            {earliestIncompleteStep === 0 ? 'Go to Document Loader' 
              : earliestIncompleteStep === 1 ? 'Go to Text Splitter' 
              : 'Go to Vector Store'}
          </button>
        </div>
      ) : (
        <>
          {/* Main Chat Area */}
          <div className="flex-grow flex flex-col justify-between border border-slate-200 dark:border-border-hairline bg-white dark:bg-ink-bg p-4 rounded min-h-[420px] max-h-[500px] transition-colors duration-200">
            {/* Final Stage Status Header */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 dark:border-emerald-900/30 pb-3 bg-emerald-50/50 dark:bg-emerald-950/10 p-3 -mx-4 -mt-4 rounded-t transition-colors duration-200">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500">
                <CheckCircle2 size={16} />
                <span className="text-xs font-mono font-semibold tracking-wide uppercase">Pipeline complete</span>
              </div>
              <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                All systems ready. You can now query the indexed knowledge base.
              </p>
            </div>

        {/* Messages List */}
        <div 
          ref={chatContainerRef}
          className="flex-grow overflow-y-auto pr-1 flex flex-col gap-3.5 mb-4 max-h-[380px] custom-scrollbar"
        >
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col gap-1 ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div 
                className={`px-3.5 py-2 rounded text-slate-800 dark:text-slate-100 font-sans max-w-[85%] border leading-relaxed transition-all duration-200 ${
                  msg.role === 'user' 
                    ? 'bg-slate-100 dark:bg-ink-hover border-slate-200 dark:border-border-hairline text-right' 
                    : msg.isError 
                      ? 'bg-red-50 dark:bg-red-950/15 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-mono text-xs' 
                      : msg.guardrailBlocked
                        ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50 text-orange-800 dark:text-orange-200'
                        : isTelemetryDrawerOpen && activeTelemetryMsgId === msg.id
                          ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800 ring-2 ring-blue-500/20 shadow-sm'
                          : 'bg-slate-50 dark:bg-ink-surface border-slate-200 dark:border-border-hairline'
                }`}
              >
                {msg.guardrailBlocked && (
                  <div className="flex items-center gap-1.5 text-xs font-bold mb-1 uppercase tracking-wide">
                    <ShieldAlert size={14} /> Guardrail Blocked
                  </div>
                )}
                <div>{msg.content}</div>
                {msg.guardrailReason && (
                   <div className="mt-2 text-[10px] font-mono opacity-80 border-t border-orange-200/50 dark:border-orange-900/50 pt-1.5">
                     Reason: {msg.guardrailReason}
                   </div>
                )}
                
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
                
                {msg.role === 'assistant' && msg.candidates && msg.candidates.length > 0 && (
                  <div className="border-t border-slate-200 dark:border-border-hairline/60 mt-2.5 pt-2 flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                      <Info size={10} /> Retrieved Candidates
                    </span>
                    <p className="text-[9px] text-slate-400 font-mono mb-1 leading-snug">
                      These chunks were retrieved by vector similarity but were not sufficiently relevant to support an answer.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                      {msg.candidates.map((candidate, idx) => (
                        <button
                          key={idx}
                          className="font-mono text-[10px] bg-slate-50 dark:bg-[#0a0c10] border border-slate-200 dark:border-border-hairline border-dashed text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 py-0.5 rounded transition-all"
                          onClick={() => openCitationsDrawer(msg.candidates, idx)}
                        >
                          [{idx + 1}] {formatSourceLabel(candidate.metadata)} ({candidate.score.toFixed(2)})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {msg.role === 'assistant' && msg.telemetry && (
                  <div className="border-t border-slate-200 dark:border-border-hairline/60 mt-2.5 pt-2 flex flex-col gap-1">
                    <div className="flex items-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/50">
                      <button 
                        onClick={() => openTelemetryDrawer(msg.id, msg.telemetry)}
                        className={`flex items-center gap-1.5 text-[9px] font-mono font-bold tracking-wider px-2.5 py-1.5 rounded transition-colors uppercase ${isTelemetryDrawerOpen && activeTelemetryMsgId === msg.id ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 dark:text-indigo-400'}`}
                      >
                        <Activity size={12} />
                        View Execution Trace ({msg.telemetry.total_duration_ms.toFixed(0)}ms)
                      </button>
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

      {/* Telemetry Side Drawer */}
      {isTelemetryDrawerOpen && (
        <div className="absolute md:relative top-0 right-0 h-full w-full md:w-[360px] bg-white dark:bg-ink-surface border border-slate-200 dark:border-border-hairline md:border-l-0 rounded z-10 flex flex-col shrink-0 transition-colors duration-200 shadow-xl md:shadow-none">
          <style>{`
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(8px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in-up { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
          `}</style>
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-border-hairline px-5 py-4 bg-slate-50 dark:bg-[#0a0c10]">
            <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 font-mono uppercase tracking-widest">
              <Activity size={14} className="text-accent" />
              <span>Execution Trace</span>
            </h3>
            <button className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors" onClick={() => setIsTelemetryDrawerOpen(false)}>
              <X size={16} />
            </button>
          </div>
          
          <div className="flex-grow overflow-y-auto p-5 flex flex-col gap-5 bg-white dark:bg-ink-surface">
            {!activeTelemetry ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 mt-20 gap-3">
                <Activity size={24} className="animate-pulse text-accent" />
                <span className="font-mono text-[10px] uppercase tracking-wider">Awaiting Telemetry...</span>
              </div>
            ) : (
              <>
                {/* Professional Summary Header */}
            <div className="flex flex-col gap-3 bg-slate-50 dark:bg-[#0a0c10] border border-slate-200 dark:border-slate-800/80 p-4 rounded-md">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 dark:border-slate-800/50">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Clock size={12}/> Total Latency</span>
                <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">{activeTelemetry.total_duration_ms.toFixed(0)} ms</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="flex flex-col gap-1">
                   <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Zap size={12}/> Prompt</span>
                   <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{activeTelemetry.prompt_tokens} tkns</span>
                 </div>
                 <div className="flex flex-col gap-1">
                   <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Zap size={12}/> Completion</span>
                   <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{activeTelemetry.completion_tokens} tkns</span>
                 </div>
                 <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><BookOpen size={12}/> Document Search</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {activeTelemetry.steps.find(s => s.name === 'Document Search')?.details?.retrieved_chunks || 0} chunks
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><FileText size={12}/> Sources Referenced</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {activeTelemetry.steps.find(s => s.name === 'Document Search')?.details?.citations_selected || 0} used
                    </span>
                  </div>
              </div>
            </div>

            {/* Pipeline Timeline */}
            <div className="flex flex-col mt-2 pl-1">
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Pipeline Execution</span>
              {activeTelemetry.steps.map((step, idx) => (
                <TelemetryStepView key={idx} step={step} idx={idx} />
              ))}
            </div>
            
              </>
            )}
          </div>
        </div>
      )}

        </>
      )}
    </div>
  )
}

export default ChatInterface
