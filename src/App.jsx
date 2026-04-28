import { useState, useEffect, useRef, useCallback } from 'react'

const STORAGE_KEY = 'claude-brain-dumper-content'

function Toast({ message, visible }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        background: '#4ade80',
        color: '#0f1a0f',
        padding: '0.75rem 1.5rem',
        borderRadius: '8px',
        fontWeight: '600',
        fontSize: '0.9rem',
        boxShadow: '0 4px 20px rgba(74,222,128,0.35)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      {message}
    </div>
  )
}

export default function App() {
  const [content, setContent] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || ''
    } catch {
      return ''
    }
  })
  const [toast, setToast] = useState({ message: '', visible: false })
  const [wordCount, setWordCount] = useState(0)
  const [lastSaved, setLastSaved] = useState(null)
  const debounceRef = useRef(null)
  const toastTimerRef = useRef(null)

  // Debounced autosave
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, content)
        setLastSaved(new Date())
      } catch (e) {
        console.warn('localStorage save failed', e)
      }
    }, 800)
    return () => clearTimeout(debounceRef.current)
  }, [content])

  // Word count
  useEffect(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0
    setWordCount(words)
  }, [content])

  const showToast = useCallback((message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ message, visible: true })
    toastTimerRef.current = setTimeout(() => {
      setToast((t) => ({ ...t, visible: false }))
    }, 2500)
  }, [])

  const handleSaveDraft = () => {
    try {
      localStorage.setItem(STORAGE_KEY, content)
      setLastSaved(new Date())
      showToast('✓ Draft saved!')
    } catch {
      showToast('⚠ Save failed — storage unavailable')
    }
  }

  const handleExportMd = () => {
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-')
    const filename = `brain-dump-${timestamp}.md`
    const header = `# Brain Dump\n_Exported: ${new Date().toLocaleString()}_\n\n---\n\n`
    const blob = new Blob([header + content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    showToast('✓ Exported as ' + filename)
  }

  const handleCopyForAI = async () => {
    const prefix = `[BRAIN DUMP — ${new Date().toLocaleString()}]\n\nPlease help me make sense of the following raw thoughts. Identify themes, action items, and any questions I seem to be wrestling with:\n\n---\n\n`
    try {
      await navigator.clipboard.writeText(prefix + content)
      showToast('✓ Copied for AI Harvest!')
    } catch {
      showToast('⚠ Clipboard access denied')
    }
  }

  const formatTime = (date) => {
    if (!date) return null
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-left">
          <div className="logo-mark">🧠</div>
          <div>
            <h1 className="app-title">Claude Brain Dumper</h1>
            <p className="app-subtitle">Pour it all out. Sort it later.</p>
          </div>
        </div>
        <div className="header-meta">
          <span className="word-count">{wordCount.toLocaleString()} {wordCount === 1 ? 'word' : 'words'}</span>
          {lastSaved && (
            <span className="autosave-indicator">
              <span className="autosave-dot" /> autosaved {formatTime(lastSaved)}
            </span>
          )}
        </div>
      </header>

      <main className="main-content">
        <textarea
          className="brain-dump-area"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing… no structure needed. Let it flow.

What's on your mind? What's weighing on you? What ideas keep circling? What do you wish someone understood?

This space is just for you."
          autoFocus
          spellCheck="true"
        />
      </main>

      <footer className="action-bar">
        <button className="btn btn-secondary" onClick={handleSaveDraft}>
          <span className="btn-icon">💾</span> Save Draft
        </button>
        <button className="btn btn-secondary" onClick={handleExportMd}>
          <span className="btn-icon">📄</span> Export .md
        </button>
        <button className="btn btn-primary" onClick={handleCopyForAI}>
          <span className="btn-icon">🤖</span> Copy for AI Harvest
        </button>
      </footer>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  )
}
