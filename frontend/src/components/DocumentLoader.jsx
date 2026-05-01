import React, { useState, useRef } from 'react'
import { FileText, Link as LinkIcon, UploadCloud, AlertCircle, Loader, CheckCircle2, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'

function DocumentLoader({ onDocumentsLoaded }) {
  const [activeTab, setActiveTab] = useState('text') // 'text' | 'pdf' | 'website'
  const [file, setFile] = useState(null)
  const [url, setUrl] = useState('')
  const [maxDepth, setMaxDepth] = useState(2)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState(null)
  const [expandedDocIndex, setExpandedDocIndex] = useState(null)
  
  const fileInputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      validateAndSetFile(droppedFile)
    }
  }

  const validateAndSetFile = (selectedFile) => {
    setError(null)
    setResults(null)
    const ext = selectedFile.name.split('.').pop().toLowerCase()
    
    if (activeTab === 'text' && ext !== 'txt') {
      setError('Please select a valid plain text (.txt) file.')
      return
    }
    if (activeTab === 'pdf' && ext !== 'pdf') {
      setError('Please select a valid PDF (.pdf) file.')
      return
    }
    
    setFile(selectedFile)
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setFile(null)
    setError(null)
    setResults(null)
    setExpandedDocIndex(null)
    if (onDocumentsLoaded) {
      onDocumentsLoaded(null)
    }
  }

  const handleLoad = async () => {
    setError(null)
    setResults(null)
    if (onDocumentsLoaded) {
      onDocumentsLoaded(null)
    }
    setLoading(true)

    try {
      let response
      if (activeTab === 'text' || activeTab === 'pdf') {
        if (!file) throw new Error('No file selected.')
        const formData = new FormData()
        formData.append('file', file)
        
        response = await fetch(`/api/v1/document-loader/${activeTab}`, {
          method: 'POST',
          body: formData,
        })
      } else {
        if (!url) throw new Error('URL is required.')
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          throw new Error('URL must start with http:// or https://')
        }
        
        response = await fetch('/api/v1/document-loader/website', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, max_depth: maxDepth }),
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `Server error: ${response.statusText}`)
      }

      const docs = await response.json()
      setResults(docs)
      setExpandedDocIndex(0)
      if (onDocumentsLoaded) {
        onDocumentsLoaded(docs)
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const toggleExpandDoc = (index) => {
    setExpandedDocIndex(expandedDocIndex === index ? null : index)
  }

  const totalCharacters = results?.reduce((sum, doc) => sum + doc.page_content.length, 0) || 0

  return (
    <div className="flex flex-col gap-4 font-sans text-sm">
      {/* Selector Tabs */}
      <div className="flex border border-slate-200 dark:border-border-hairline bg-slate-50 dark:bg-ink-bg p-0.5 rounded transition-colors duration-200">
        <button 
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all text-xs font-mono uppercase ${
            activeTab === 'text' 
              ? 'bg-white dark:bg-ink-hover text-accent font-semibold shadow-sm dark:shadow-none' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
          onClick={() => handleTabChange('text')}
        >
          <FileText size={14} />
          <span>Plain Text</span>
        </button>
        <button 
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all text-xs font-mono uppercase ${
            activeTab === 'pdf' 
              ? 'bg-white dark:bg-ink-hover text-accent font-semibold shadow-sm dark:shadow-none' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
          onClick={() => handleTabChange('pdf')}
        >
          <FileText size={14} />
          <span>PDF Document</span>
        </button>
        <button 
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all text-xs font-mono uppercase ${
            activeTab === 'website' 
              ? 'bg-white dark:bg-ink-hover text-accent font-semibold shadow-sm dark:shadow-none' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
          onClick={() => handleTabChange('website')}
        >
          <LinkIcon size={14} />
          <span>Website URL</span>
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {activeTab !== 'website' ? (
          <div 
            className="border border-dashed border-slate-300 dark:border-border-hairline bg-slate-50 dark:bg-ink-bg rounded p-6 flex flex-col items-center justify-center cursor-pointer transition-colors hover:border-accent/40 dark:hover:border-accent/40"
            onDragOver={handleDrag}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept={activeTab === 'text' ? '.txt' : '.pdf'}
              className="hidden"
            />
            {file ? (
              <div className="flex justify-between items-center w-full max-w-md bg-white dark:bg-ink-hover border border-slate-200 dark:border-border-hairline p-3 rounded font-mono transition-colors duration-200" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3">
                  <FileText size={28} className="text-accent shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-700 dark:text-slate-200 truncate font-semibold">{file.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{formatBytes(file.size)}</p>
                  </div>
                </div>
                <button 
                  className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                  onClick={() => {
                    setFile(null)
                    setResults(null)
                    if (onDocumentsLoaded) {
                      onDocumentsLoaded(null)
                    }
                  }}
                  title="Remove file"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center gap-1.5">
                <UploadCloud size={36} className="text-slate-400 dark:text-slate-500" />
                <p className="text-xs text-slate-600 dark:text-slate-300">Drag & drop your <span className="font-mono text-accent">.{activeTab}</span> file here, or click to browse</p>
                <span className="text-[10px] text-slate-500 font-mono">Maximum size: 20MB</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3.5 bg-slate-50 dark:bg-ink-bg border border-slate-200 dark:border-border-hairline p-4 rounded transition-colors duration-200">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="url-input" className="text-xs font-semibold text-slate-600 dark:text-slate-300">Documentation website base URL</label>
              <input 
                id="url-input"
                type="url"
                placeholder="https://docs.example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-white dark:bg-[#0a0c10] border border-slate-200 dark:border-border-hairline text-slate-700 dark:text-slate-200 text-xs font-mono px-3 py-2 rounded focus:outline-none focus:border-accent w-full transition-colors duration-200"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <label htmlFor="depth-input" className="font-semibold text-slate-600 dark:text-slate-300">Crawler recursion depth</label>
                <span className="font-mono text-accent">{maxDepth} {maxDepth === 1 ? 'level' : 'levels'}</span>
              </div>
              <input 
                id="depth-input"
                type="range"
                min="1"
                max="5"
                value={maxDepth}
                onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-200 dark:bg-[#0a0c10] rounded-lg appearance-none cursor-pointer accent-accent border border-slate-300 dark:border-border-hairline"
              />
              <span className="text-[10px] font-mono text-slate-500">Maximum sub-link click depth to recursively index documentation pages.</span>
            </div>
          </div>
        )}

        {error && (
          <div className="border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3.5 rounded flex items-start gap-2.5 text-xs font-mono">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button 
          className="w-full bg-accent hover:bg-accent-hover text-white py-2 px-4 rounded text-xs font-semibold font-mono tracking-wide uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          disabled={loading || (activeTab === 'website' ? !url : !file)}
          onClick={handleLoad}
        >
          {loading ? (
            <>
              <Loader size={14} className="animate-spin text-white" />
              <span>
                {activeTab === 'website' 
                  ? 'Crawling web pages...' 
                  : activeTab === 'pdf' 
                    ? 'Extracting PDF text...' 
                    : 'Reading text file...'}
              </span>
            </>
          ) : (
            <span>Load source</span>
          )}
        </button>

        {results && (
          <div className="border border-slate-200 dark:border-border-hairline bg-white dark:bg-ink-bg rounded p-4 flex flex-col gap-4 mt-2 transition-colors duration-200">
            <div className="flex flex-wrap justify-between items-center border-b border-slate-200 dark:border-border-hairline pb-3 gap-2">
              <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-mono font-semibold">
                <CheckCircle2 size={16} />
                <span>Source ingested successfully</span>
              </div>
              <div className="flex gap-2 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                <span className="border border-slate-200 dark:border-border-hairline px-2 py-0.5 rounded bg-slate-50 dark:bg-ink-hover">
                  <strong className="text-slate-800 dark:text-slate-200">{results.length}</strong> {results.length === 1 ? 'doc' : 'docs'}
                </span>
                <span className="border border-slate-200 dark:border-border-hairline px-2 py-0.5 rounded bg-slate-50 dark:bg-ink-hover">
                  <strong className="text-slate-800 dark:text-slate-200">{totalCharacters.toLocaleString()}</strong> chars
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
              {results.map((doc, idx) => (
                <div className="border border-slate-200 dark:border-border-hairline bg-slate-50 dark:bg-[#0a0c10] rounded overflow-hidden shrink-0 transition-colors duration-200" key={idx}>
                  <button 
                    className="flex justify-between items-center w-full px-3 py-2 hover:bg-slate-100 dark:hover:bg-ink-hover transition-colors text-left"
                    onClick={() => toggleExpandDoc(idx)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-mono border border-slate-200 dark:border-border-hairline px-1 rounded text-slate-500 dark:text-slate-400 bg-white dark:bg-ink-surface">#{idx + 1}</span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-mono truncate">
                        {(() => {
                          const source = doc.metadata?.source;
                          if (!source || typeof source !== 'string') return 'document';
                          return source.split(/[/\\]/).pop() || source;
                        })()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                      {doc.metadata?.page !== undefined && doc.metadata?.page !== null && (
                        <span className="border border-slate-200 dark:border-border-hairline px-1.5 py-0.5 rounded bg-white dark:bg-ink-surface">Page {Number(doc.metadata.page) + 1}</span>
                      )}
                      {expandedDocIndex === idx ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </button>
                  {expandedDocIndex === idx && (
                    <div className="p-3 border-t border-slate-200 dark:border-border-hairline bg-white dark:bg-ink-surface flex flex-col gap-2 text-xs transition-colors duration-200">
                      <div>
                        <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">Preserved Metadata</h4>
                        <pre className="bg-slate-50 dark:bg-[#0a0c10] border border-slate-200 dark:border-border-hairline p-2 font-mono text-[10px] text-slate-600 dark:text-slate-400 overflow-auto select-all rounded max-h-[120px]">
                          {JSON.stringify(doc.metadata, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">Content Snippet</h4>
                        <div className="bg-slate-50 dark:bg-[#0a0c10] border border-slate-200 dark:border-border-hairline p-2 text-xs text-slate-700 dark:text-slate-300 font-sans whitespace-pre-wrap rounded max-h-[150px] overflow-y-auto">
                          {doc.page_content}
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
    </div>
  )
}

export default DocumentLoader
