import { useEffect, useRef, useState } from 'react'
import '@fontsource/ibm-plex-mono/300.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource-variable/schibsted-grotesk'
import Mascot from './Mascot'
import { startScene } from './landing3d'
import './Landing.css'

const GITHUB = 'https://github.com/Rosheni-a11y/studybuddy-ai'
const PORTFOLIO = 'https://roshenios95.vercel.app'

const PROMPTS = [
  'Summarize chapter 5 of my lecture notes.',
  'Quiz me with 3 questions on neural networks.',
  'Explain gradient descent like I am five.',
  'Make flashcards for the key terms.',
]

const FEATURES = ['Ask your notes', 'Summarize', 'Quiz me', 'Flashcards']

const TABS = [
  'Ask your notes',
  'Summarize chapters',
  'Practice quizzes',
  'Flashcards for revision',
  'Answers with sources',
]

const STEPS = [
  {
    n: '01',
    tag: 'Upload',
    role: 'Step one of three',
    title: 'Drop in your lecture PDF. I read every page.',
    tech: 'PyPDF · text splitter',
  },
  {
    n: '02',
    tag: 'Search',
    role: 'Step two of three',
    title: 'Ask anything. I find the parts of your notes that match.',
    tech: 'Embeddings · ChromaDB',
  },
  {
    n: '03',
    tag: 'Answer',
    role: 'Step three of three',
    title: 'You get an answer from your own notes, with sources.',
    tech: 'Agent · LLM · sources',
  },
]

function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true)
          io.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      className={`rv ${on ? 'in' : ''} ${className}`}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </div>
  )
}

export default function Landing({ onStart }) {
  const canvasRef = useRef(null)
  const [no3d, setNo3d] = useState(false)
  const [banner, setBanner] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [sec, setSec] = useState(0)
  const [typed, setTyped] = useState('')
  const [promptIdx, setPromptIdx] = useState(0)
  const [tab, setTab] = useState(0)
  const [tabAnim, setTabAnim] = useState(true)
  const [step, setStep] = useState(0)
  const [stepFade, setStepFade] = useState(false)
  const s1 = useRef(null)
  const s2 = useRef(null)
  const s3 = useRef(null)

  useEffect(() => {
    const stop = startScene(canvasRef.current)
    if (!stop) {
      setNo3d(true)
      return undefined
    }
    return stop
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const refs = [s1, s2, s3]
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setSec(refs.findIndex((r) => r.current === e.target))
        })
      },
      { threshold: 0.5 },
    )
    refs.forEach((r) => r.current && io.observe(r.current))
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const full = PROMPTS[promptIdx]
    let i = 0
    let timer
    const type = () => {
      i += 1
      setTyped(full.slice(0, i))
      if (i < full.length) timer = setTimeout(type, 38)
      else timer = setTimeout(del, 2600)
    }
    const del = () => {
      i -= 2
      if (i <= 0) {
        setTyped('')
        timer = setTimeout(() => setPromptIdx((p) => (p + 1) % PROMPTS.length), 250)
        return
      }
      setTyped(full.slice(0, i))
      timer = setTimeout(del, 14)
    }
    timer = setTimeout(type, 38)
    return () => clearTimeout(timer)
  }, [promptIdx])

  useEffect(() => {
    const id = setInterval(() => {
      setTab((t) => {
        if (t + 1 === TABS.length) {
          setTimeout(() => {
            setTabAnim(false)
            setTab(0)
            setTimeout(() => setTabAnim(true), 50)
          }, 950)
        }
        return t + 1
      })
    }, 2400)
    return () => clearInterval(id)
  }, [])

  const goStep = (dir) => {
    setStepFade(true)
    setTimeout(() => {
      setStep((s) => (s + dir + STEPS.length) % STEPS.length)
      setStepFade(false)
    }, 450)
  }

  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: 'smooth' })
  const cur = STEPS[step]
  const next = STEPS[(step + 1) % STEPS.length]

  return (
    <div className="lp">
      <canvas ref={canvasRef} className="lp-canvas" />
      {no3d && (
        <div className="lp-fallback">
          <Mascot size={380} />
        </div>
      )}

      <div className="lp-guides" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>

      <div className={`lp-banner ${banner && !scrolled ? '' : 'hide'}`}>
        <span>
          <b>New:</b> StudyBuddy AI is live. Your notes, answered
        </span>
        <button type="button" onClick={() => setBanner(false)} aria-label="Close">
          ×
        </button>
      </div>

      <nav className={`lp-nav ${banner && !scrolled ? '' : 'up'}`}>
        <div className="lp-logo">
          <img src="/logo-small.webp" alt="" />
          <span>StudyBuddy AI</span>
        </div>
        <div className="lp-menu">
          <button type="button" onClick={() => scrollTo(s2)}>
            Features
          </button>
          <button type="button" onClick={() => scrollTo(s3)}>
            How it works
          </button>
          <a href={GITHUB} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href={PORTFOLIO} target="_blank" rel="noreferrer">
            Portfolio
          </a>
        </div>
        <a className="lp-pad" href={PORTFOLIO} target="_blank" rel="noreferrer">
          Built by Rosheni
        </a>
        <button type="button" className="lp-launch" onClick={onStart}>
          <span>●</span> Open StudyBuddy
        </button>
      </nav>

      <div className="lp-rail" aria-hidden="true">
        <div className="lp-dots">
          {Array.from({ length: 14 }).map((_, i) => (
            <i key={i} />
          ))}
        </div>
        <div className="lp-rail-label" style={{ top: `${sec * 31}%` }}>
          {['Intro', 'Features', 'How'][sec]}
        </div>
        <div className="lp-rail-menu">≡ MENU</div>
      </div>

      <section className="lp-s lp-intro" ref={s1}>
        <Reveal className="lp-prompt">
          <div className="lp-quote-tab">"</div>
          <div className="lp-prompt-box">
            <span>{typed}</span>
            <i className="lp-caret" />
          </div>
          <div className="lp-prompt-next">{PROMPTS[(promptIdx + 1) % PROMPTS.length]}</div>
        </Reveal>

        <Reveal delay={0.2} className="lp-features">
          {FEATURES.map((f) => (
            <div key={f}>
              <i />
              {f}
            </div>
          ))}
          <div className="dim">
            <i />
            And sources
          </div>
        </Reveal>

        <Reveal className="lp-headline">
          <div className="lp-kicker">Unleash the power of</div>
          <h1>
            <span className="gbox cut">Your notes,</span>
            <span className="gbox">answered.</span>
          </h1>
        </Reveal>

        <Reveal delay={0.3} className="lp-subline">
          Upload your lecture PDFs. Ask, summarize, get quizzed. Every answer comes from your own
          notes.
          <button type="button" className="lp-cta" onClick={onStart}>
            Try it now →
          </button>
        </Reveal>

        <button type="button" className="lp-scroll" onClick={() => scrollTo(s2)}>
          Scroll <b>↓</b>
        </button>
      </section>

      <section className="lp-s lp-product" ref={s2}>
        <div className="lp-tabs">
          <div
            className="lp-tabs-strip"
            style={{
              transform: `translateX(calc(${tab} * -33vw))`,
              transition: tabAnim ? 'transform .9s cubic-bezier(.65,0,.2,1)' : 'none',
            }}
          >
            {[...TABS, ...TABS].map((t, i) => (
              <div
                key={i}
                className={`lp-tab ${i === tab ? 'active' : ''} ${i < tab ? 'past' : ''}`}
              >
                <span className="lp-tab-n">{String((i % TABS.length) + 1).padStart(2, '0')}</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>

        <Reveal className="lp-product-head">
          <div className="lp-dots-text">··</div>
          <h2>
            <span className="rbox">Study Smarter</span>
            <span>With Your Own Notes</span>
          </h2>
          <button type="button" className="lp-cta" onClick={onStart}>
            Open the app →
          </button>
        </Reveal>
      </section>

      <section className="lp-s lp-how" ref={s3}>
        <div className="lp-how-strip">
          <div className="lp-bracket">
            <span>Step</span>
            <b>{cur.n}</b>
          </div>
          <img className="lp-avatar" src="/logo-small.webp" alt="" />
          <i className="lp-dot" />
          <span className="lp-who">{cur.tag}</span>
          <span className="lp-role">{cur.role}</span>
        </div>

        <div className={`lp-step ${stepFade ? 'fade' : ''}`}>
          <p>{cur.title}</p>
          <small>{cur.tech}</small>
          <button type="button" className="lp-try" onClick={onStart}>
            Try for yourself (Open the app)
          </button>
        </div>

        <div className="lp-arrows">
          <button type="button" onClick={() => goStep(-1)} aria-label="Previous step">
            ←
          </button>
          <button type="button" onClick={() => goStep(1)} aria-label="Next step">
            →
          </button>
        </div>

        <div className="lp-ghost">{next.title}</div>

        <footer className="lp-footer">
          <span>
            StudyBuddy AI · 2026 · Built by Rosheni ·{' '}
            <a href={GITHUB} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </span>
        </footer>
      </section>
    </div>
  )
}
