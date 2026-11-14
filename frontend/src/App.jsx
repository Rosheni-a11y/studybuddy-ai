import { useEffect, useRef, useState } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000'

const SUGGESTIONS = [
  { label: 'Summarize key concepts', icon: 'sparkles' },
  { label: 'Create practice quiz', icon: 'quiz' },
  { label: 'Explain this topic', icon: 'lightbulb' },
  { label: 'Compare concepts', icon: 'compare' },
]

function Icon({ name, size = 18 }) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
  switch (name) {
    case 'logo':
      return (
        <svg {...props} viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <path d="M12 2 3 6v6c0 5 3.8 9.4 9 10 5.2-.6 9-5 9-10V6l-9-4Z" opacity=".18" />
          <path
            d="M7.5 8.5h9M7.5 12h9M7.5 15.5h6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M12 2 3 6v6c0 5 3.8 9.4 9 10 5.2-.6 9-5 9-10V6l-9-4Z"
            stroke="currentColor"
            strokeWidth="1.8"
            fill="none"
          />
        </svg>
      )
    case 'upload':
      return (
        <svg {...props}>
          <path d="M12 16V4M7 9l5-5 5 5" />
          <path d="M5 20h14" />
        </svg>
      )
    case 'send':
      return (
        <svg {...props}>
          <path d="M22 2 11 13" />
          <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
        </svg>
      )
    case 'chevron':
      return (
        <svg {...props}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      )
    case 'file':
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
      )
    case 'sparkles':
      return (
        <svg {...props}>
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
        </svg>
      )
    case 'quiz':
      return (
        <svg {...props}>
          <path d="M9.1 9a3 3 0 1 1 4.9 2.3c-.9.7-2 1.2-2 2.7" />
          <circle cx="12" cy="17.5" r=".8" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'lightbulb':
      return (
        <svg {...props}>
          <path d="M9 18h6" />
          <path d="M10 21h4" />
          <path d="M12 3a6 6 0 0 0-4 10.5c.8.8 1.5 1.5 1.5 3h5c0-1.5.7-2.2 1.5-3A6 6 0 0 0 12 3Z" />
        </svg>
      )
    case 'compare':
      return (
        <svg {...props}>
          <path d="M3 7h7M3 7l3-3M3 7l3 3" />
          <path d="M21 17h-7M21 17l-3 3M21 17l-3-3" />
        </svg>
      )
    case 'bot':
      return (
        <svg {...props}>
          <rect x="4" y="7" width="16" height="12" rx="3" />
          <circle cx="9" cy="13" r="1" fill="currentColor" stroke="none" />
          <circle cx="15" cy="13" r="1" fill="currentColor" stroke="none" />
          <path d="M12 3v4M9 19v2M15 19v2" />
        </svg>
      )
    case 'user':
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      )
    case 'check':
      return (
        <svg {...props}>
          <path d="M5 12l5 5L20 7" />
        </svg>
      )
    default:
      return null
  }
}

function Avatar({ kind }) {
  return (
    <div className={`avatar avatar-${kind}`} aria-hidden="true">
      <Icon name={kind === 'ai' ? 'bot' : 'user'} size={18} />
    </div>
  )
}

function SourceItem({ source }) {
  const score = Math.max(0, Math.min(1, source.relevance ?? 0))
  const pct = Math.round(score * 100)
  return (
    <div className="source">
      <div className="source-row">
        <div className="source-file">
          <Icon name="file" size={14} />
          <span>{source.source_file}</span>
        </div>
        <div className="source-score">
          <div className="score-bar">
            <span style={{ width: `${pct}%` }} />
          </div>
          <span className="score-pct">{pct}%</span>
        </div>
      </div>
      {source.text && <p className="source-snippet">{source.text}…</p>}
    </div>
  )
}

function Message({ msg }) {
  const [openSources, setOpenSources] = useState(false)
  const isAi = msg.role === 'ai'

  return (
    <div className={`msg ${isAi ? 'msg-ai' : 'msg-user'}`}>
      {isAi && <Avatar kind="ai" />}
      <div className="msg-stack">
        <div className="bubble">
          {msg.error ? (
            <p className="bubble-error">{msg.content}</p>
          ) : (
            <p>{msg.content}</p>
          )}
        </div>
        {isAi && msg.sources && msg.sources.length > 0 && (
          <div className="sources">
            <button
              type="button"
              className={`sources-toggle ${openSources ? 'is-open' : ''}`}
              onClick={() => setOpenSources((v) => !v)}
            >
              <span className="dot" />
              <span>
                {openSources ? 'Hide' : 'Show'} sources ({msg.sources.length})
              </span>
              <Icon name="chevron" size={14} />
            </button>
            {openSources && (
              <div className="sources-list">
                {msg.sources.map((s, i) => (
                  <SourceItem key={i} source={s} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {!isAi && <Avatar kind="user" />}
    </div>
  )
}

function TypingDots() {
  return (
    <div className="msg msg-ai">
      <Avatar kind="ai" />
      <div className="msg-stack">
        <div className="bubble typing">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onPick }) {
  return (
    <div className="empty">
      <div className="empty-badge">
        <Icon name="sparkles" size={22} />
      </div>
      <h2>Ask anything from your notes</h2>
      <p>
        Upload your lecture PDFs, then ask questions. StudyBuddy retrieves the
        most relevant passages and answers using only your material.
      </p>
      <div className="empty-tips">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            type="button"
            className="tip"
            onClick={() => onPick(s.label)}
          >
            <Icon name={s.icon} size={16} />
            <span>{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isAsking, setIsAsking] = useState(false)
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState(null)
  const fileInputRef = useRef(null)
  const scrollRef = useRef(null)
  const textareaRef = useRef(null)

  const fileCount = files.length

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isAsking])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(id)
  }, [toast])

  const autoSize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  useEffect(autoSize, [input])

  const handleSend = async (overrideText) => {
    const text = (overrideText ?? input).trim()
    if (!text || isAsking) return

    setInput('')
    const userMsg = { role: 'user', content: text, id: Date.now() }
    setMessages((m) => [...m, userMsg])
    setIsAsking(true)

    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text }),
      })

      let data = null
      try {
        data = await res.json()
      } catch {
        // backend returned non-JSON (e.g. Flask HTML error page)
      }

      if (!res.ok) {
        throw new Error(
          (data && data.error) ||
            `Backend error ${res.status}. Check the Flask terminal for the traceback.`,
        )
      }

      setMessages((m) => [
        ...m,
        {
          role: 'ai',
          content: data.answer,
          sources: data.sources || [],
          id: Date.now() + 1,
        },
      ])
    } catch (err) {
      const isNetwork = err instanceof TypeError
      setMessages((m) => [
        ...m,
        {
          role: 'ai',
          content: isNetwork
            ? "I couldn't reach the StudyBuddy server. Make sure the backend is running on port 5000."
            : err.message,
          error: true,
          id: Date.now() + 1,
        },
      ])
    } finally {
      setIsAsking(false)
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Upload failed')

      setFiles((f) => [
        ...f,
        { name: data.filename, pages: data.pages, chunks: data.chunks },
      ])
      setToast({ kind: 'success', text: data.message })
    } catch (err) {
      setToast({ kind: 'error', text: err.message })
    } finally {
      setUploading(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const showEmpty = messages.length === 0 && !isAsking

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <div className="brand-logo">
              <Icon name="logo" size={22} />
            </div>
            <div className="brand-text">
              <h1>StudyBuddy AI</h1>
              <span>Your personal study assistant</span>
            </div>
          </div>

          <div className="header-actions">
            <div className="file-badge" title={`${fileCount} file${fileCount === 1 ? '' : 's'} indexed`}>
              <Icon name="file" size={14} />
              <span>
                {fileCount} file{fileCount === 1 ? '' : 's'}
              </span>
            </div>
            <button
              type="button"
              className="upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <span className="spinner" /> Uploading…
                </>
              ) : (
                <>
                  <Icon name="upload" size={16} /> Upload PDF
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              hidden
              onChange={handleFileChange}
            />
          </div>
        </div>
      </header>

      <main className="chat" ref={scrollRef}>
        <div className="chat-inner">
          {showEmpty ? (
            <EmptyState onPick={(t) => handleSend(t)} />
          ) : (
            <>
              {messages.map((m) => (
                <Message key={m.id} msg={m} />
              ))}
              {isAsking && <TypingDots />}
            </>
          )}
        </div>
      </main>

      <footer className="composer">
        <div className="composer-inner">
          {!showEmpty && (
            <div className="chips">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  className="chip"
                  onClick={() => handleSend(s.label)}
                  disabled={isAsking}
                >
                  <Icon name={s.icon} size={14} />
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          )}

          <div className="input-bar">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder={
                fileCount === 0
                  ? 'Upload a PDF first, then ask anything…'
                  : 'Ask a question about your notes…'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button
              type="button"
              className="send-btn"
              onClick={() => handleSend()}
              disabled={!input.trim() || isAsking}
              aria-label="Send message"
            >
              <Icon name="send" size={18} />
            </button>
          </div>
          <p className="hint">
            StudyBuddy answers only from your uploaded notes. Press{' '}
            <kbd>Enter</kbd> to send, <kbd>Shift</kbd>+<kbd>Enter</kbd> for a
            new line.
          </p>
        </div>
      </footer>

      {toast && (
        <div className={`toast toast-${toast.kind}`} role="status">
          <Icon name={toast.kind === 'success' ? 'check' : 'file'} size={16} />
          <span>{toast.text}</span>
        </div>
      )}
    </div>
  )
}

export default App
