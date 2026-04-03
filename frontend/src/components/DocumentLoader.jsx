import React, { useState, useRef } from 'react'
import { FileText, Link, UploadCloud, AlertCircle, Loader, CheckCircle2, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'

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
  const dragRef = useRef(null)

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

  // Calculate totals
  const totalCharacters = results?.reduce((sum, doc) => sum + doc.page_content.length, 0) || 0

  return (
    <div className="doc-loader-wrapper">
      <div className="loader-tabs">
        <button 
          className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => handleTabChange('text')}
        >
          <FileText size={18} />
          <span>Plain Text</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'pdf' ? 'active' : ''}`}
          onClick={() => handleTabChange('pdf')}
        >
          <FileText size={18} />
          <span>PDF Document</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'website' ? 'active' : ''}`}
          onClick={() => handleTabChange('website')}
        >
          <Link size={18} />
          <span>Documentation Website</span>
        </button>
      </div>

      <div className="loader-content">
        {activeTab !== 'website' ? (
          <div 
            className="drop-zone"
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
              style={{ display: 'none' }}
            />
            {file ? (
              <div className="selected-file-info" onClick={(e) => e.stopPropagation()}>
                <div className="file-meta">
                  <FileText className="file-icon-glow" size={32} />
                  <div>
                    <p className="file-name">{file.name}</p>
                    <p className="file-size">{formatBytes(file.size)}</p>
                  </div>
                </div>
                <button 
                  className="clear-file-btn"
                  onClick={() => {
                    setFile(null)
                    setResults(null)
                    if (onDocumentsLoaded) {
                      onDocumentsLoaded(null)
                    }
                  }}
                  title="Remove file"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ) : (
              <div className="drop-prompt">
                <UploadCloud size={48} className="cloud-icon" />
                <p>Drag & drop your <strong>.{activeTab}</strong> file here, or click to browse</p>
                <span>Maximum size: 20MB</span>
              </div>
            )}
          </div>
        ) : (
          <div className="website-inputs">
            <div className="input-group">
              <label htmlFor="url-input">Documentation URL</label>
              <input 
                id="url-input"
                type="url"
                placeholder="https://docs.example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="custom-input"
              />
            </div>
            <div className="input-group">
              <div className="slider-header">
                <label htmlFor="depth-input">Crawl Depth</label>
                <span className="slider-value">{maxDepth} {maxDepth === 1 ? 'level' : 'levels'}</span>
              </div>
              <input 
                id="depth-input"
                type="range"
                min="1"
                max="5"
                value={maxDepth}
                onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                className="custom-slider"
              />
              <span className="slider-hint">Levels deep to follow relative internal hyperlinks</span>
            </div>
          </div>
        )}

        {error && (
          <div className="error-card">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <button 
          className="load-action-btn"
          disabled={loading || (activeTab === 'website' ? !url : !file)}
          onClick={handleLoad}
        >
          {loading ? (
            <>
              <Loader size={20} className="spinner" />
              <span>
                {activeTab === 'website' 
                  ? 'Crawling web pages...' 
                  : activeTab === 'pdf' 
                    ? 'Extracting PDF text...' 
                    : 'Reading text file...'}
              </span>
            </>
          ) : (
            <span>Load Source</span>
          )}
        </button>

        {results && (
          <div className="results-pane">
            <div className="results-header">
              <div className="success-title">
                <CheckCircle2 size={22} className="success-icon" />
                <h3>Ingested Successfully</h3>
              </div>
              <div className="stats-row">
                <div className="stat-pill">
                  <strong>{results.length}</strong> {results.length === 1 ? 'Document' : 'Documents'}
                </div>
                <div className="stat-pill">
                  <strong>{totalCharacters.toLocaleString()}</strong> Characters
                </div>
              </div>
            </div>

            <div className="documents-list">
              {results.map((doc, idx) => (
                <div className="doc-item" key={idx}>
                  <div 
                    className={`doc-item-header ${expandedDocIndex === idx ? 'expanded' : ''}`}
                    onClick={() => toggleExpandDoc(idx)}
                  >
                    <div className="doc-meta-title">
                      <span className="doc-index-badge">#{idx + 1}</span>
                      <p className="doc-source-name">
                        {doc.metadata?.source?.split('/').pop() || doc.metadata?.source || 'document'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {doc.metadata?.page && (
                        <span className="page-badge">Page {doc.metadata.page}</span>
                      )}
                      {expandedDocIndex === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                  {expandedDocIndex === idx && (
                    <div className="doc-item-body">
                      <div className="metadata-viewer">
                        <h4>Preserved Metadata</h4>
                        <pre>{JSON.stringify(doc.metadata, null, 2)}</pre>
                      </div>
                      <div className="content-viewer">
                        <h4>Content Snippet</h4>
                        <p>{doc.page_content}</p>
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
