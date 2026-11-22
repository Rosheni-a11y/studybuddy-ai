import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import './App.css'
import { askQuestion, uploadPdf, getStats, clearNotes } from './api'
import Mascot from './Mascot'

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
    case 'chart':
      return (
        <svg {...props}>
          <path d="M4 20V10" />
          <path d="M10 20V4" />
          <path d="M16 20v-7" />
          <path d="M22 20H2" />
        </svg>
      )
    case 'chat':
      return (
        <svg {...props}>
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
        </svg>
      )
    case 'refresh':
      return (
        <svg {...props}>
          <path d="M20 11a8 8 0 0 0-14.9-3M4 5v4h4" />
          <path d="M4 13a8 8 0 0 0 14.9 3M20 19v-4h-4" />
        </svg>
      )
    case 'trash':
      return (
        <svg {...props}>
          <path d="M4 7h16M10 11v6M14 11v6" />
          <path d="M6 7l1 13h10l1-13M9 7V4h6v3" />
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
            <ReactMarkdown>{msg.content}</ReactMarkdown>
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
      <Mascot size={200} />
      <h2>Hi! What shall we study today?</h2>
      <p>
        Upload your lecture PDFs, then ask me anything. I only answer from
        your own notes, so you can trust what you read.
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

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button type="button" className="ghost-btn" onClick={onCancel}>Cancel</button>
          <button type="button" className="ghost-btn ghost-danger" onClick={onConfirm}>Yes, clear all</button>
        </div>
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
  const [uploadStatus, setUploadStatus] = useState(null)
  const [stats, setStats] = useState('')
  const [statsBusy, setStatsBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const fileInputRef = useRef(null)
  const scrollRef = useRef(null)
  const textareaRef = useRef(null)

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

  const refreshStats = async (quiet = false) => {
    setStatsBusy(true)
    try {
      setStats(await getStats())
    } catch (err) {
      if (!quiet) setToast({ kind: 'error', text: err.message })
    } finally {
      setStatsBusy(false)
    }
  }

  useEffect(() => {
    refreshStats(true)
  }, [])

  const handleSend = async (overrideText) => {
    const text = (overrideText ?? input).trim()
    if (!text || isAsking) return

    setInput('')
    const userMsg = { role: 'user', content: text, id: Date.now() }
    setMessages((m) => [...m, userMsg])
    setIsAsking(true)

    try {
      const data = await askQuestion(text)

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
            ? "I couldn't reach the StudyBuddy server. If you are testing locally, make sure Flask is running on port 5000."
            : err.message,
          error: true,
          id: Date.now() + 1,
        },
      ])
    } finally {
      setIsAsking(false)
    }
  }

  const uploadFile = async (file) => {
    if (!file) return
    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      setUploadStatus({ kind: 'error', text: 'Please choose a PDF file.' })
      return
    }

    setUploading(true)
    setUploadStatus(null)
    try {
      const data = await uploadPdf(file)
      setFiles((f) => [
        ...f,
        { name: data.filename || file.name, pages: data.pages, chunks: data.chunks },
      ])
      setUploadStatus({ kind: 'success', text: data.message })
      refreshStats(true)
    } catch (err) {
      setUploadStatus({ kind: 'error', text: err.message })
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    uploadFile(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    uploadFile(e.dataTransfer.files?.[0])
  }

  const handleClear = async () => {
    setShowConfirm(false)
    try {
      const text = await clearNotes()
      setFiles([])
      setUploadStatus(null)
      setToast({ kind: 'success', text })
      refreshStats(true)
    } catch (err) {
      setToast({ kind: 'error', text: err.message })
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
            <img className="brand-logo" src="/logo-small.webp" alt="StudyBuddy AI logo" />
            <div className="brand-text">
              <h1>StudyBuddy AI</h1>
              <span>Your personal study assistant</span>
            </div>
          </div>

          <button
            type="button"
            className="notes-toggle"
            onClick={() => setNotesOpen((o) => !o)}
            aria-expanded={notesOpen}
          >
            <Icon name="file" size={15} /> {notesOpen ? 'Hide notes' : 'My notes'}
          </button>
        </div>
      </header>

      <div className={`workspace ${notesOpen ? 'notes-open' : ''}`}>
        <aside className={`sidebar ${notesOpen ? 'open' : ''}`}>
          <section className="card">
            <h3>
              <Icon name="file" size={16} /> Upload notes
            </h3>
            <div
              className={`dropzone ${dragging ? 'drag' : ''} ${uploading ? 'busy' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => !uploading && fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  if (!uploading) fileInputRef.current?.click()
                }
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              {uploading ? (
                <>
                  <span className="spinner spinner-dark" />
                  <strong>Reading your PDF…</strong>
                  <span>This can take a moment</span>
                </>
              ) : (
                <>
                  <Icon name="upload" size={26} />
                  <strong>Drop a PDF here</strong>
                  <span>or click to browse</span>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              hidden
              onChange={handleFileChange}
            />
            {uploadStatus && (
              <div className={`status status-${uploadStatus.kind}`} role="status">
                {uploadStatus.text}
              </div>
            )}
            {files.length > 0 && (
              <ul className="file-list">
                {files.map((f, i) => (
                  <li className="file-item" key={`${f.name}-${i}`}>
                    <Icon name="file" size={15} />
                    <div className="file-text">
                      <span className="name" title={f.name}>
                        {f.name}
                      </span>
                      {(f.pages || f.chunks) && (
                        <span className="meta">
                          {f.pages ? `${f.pages} pages` : ''}
                          {f.pages && f.chunks ? ' · ' : ''}
                          {f.chunks ? `${f.chunks} chunks` : ''}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <h3>
              <Icon name="chart" size={16} /> Database
            </h3>
            <div className="stats-box">
              {statsBusy && !stats ? 'Checking…' : stats || 'No stats yet. Press Refresh.'}
            </div>
            <div className="btn-row">
              <button
                type="button"
                className="ghost-btn"
                onClick={() => refreshStats(false)}
                disabled={statsBusy}
              >
                <Icon name="refresh" size={14} /> Refresh
              </button>
              <button type="button" className="ghost-btn ghost-danger" onClick={() => setShowConfirm(true)}>
                <Icon name="trash" size={14} /> Clear
              </button>
            </div>
          </section>

          <section className="card can-do">
            <h3>
              <Icon name="sparkles" size={16} /> What I can do
            </h3>
            <ul>
              <li>
                <strong>Ask</strong> any question about your notes
              </li>
              <li>
                <strong>Summarize</strong> a chapter or topic
              </li>
              <li>
                <strong>Quiz</strong> you with practice questions
              </li>
              <li>
                <strong>Flashcards</strong> for the key terms
              </li>
            </ul>
          </section>
        </aside>

        <section className="chat-col">
          <div className="chat-head">
            <h2>
              <Icon name="chat" size={16} /> Chat with your notes
            </h2>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => setMessages([])}
              disabled={messages.length === 0 || isAsking}
            >
              New chat
            </button>
          </div>

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
                  placeholder="Ask a question about your notes…"
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
        </section>
      </div>

      {showConfirm && (
        <ConfirmModal
          message="Delete all uploaded notes? This cannot be undone."
          onConfirm={handleClear}
          onCancel={() => setShowConfirm(false)}
        />
      )}

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
