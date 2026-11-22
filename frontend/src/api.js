import { Client } from '@gradio/client'

const SPACE = 'Rosheni123/studybuddy-ai'
const FLASK = 'http://127.0.0.1:5000'
const isLocal =
  window.location.hostname === 'localhost' && import.meta.env.VITE_USE_SPACE !== 'true'

let clientPromise = null
function getClient() {
  if (!clientPromise) {
    clientPromise = Client.connect(SPACE).catch((err) => {
      clientPromise = null
      throw err
    })
  }
  return clientPromise
}

export async function askQuestion(question, history = []) {
  if (isLocal) {
    const res = await fetch(`${FLASK}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) throw new Error((data && data.error) || `Backend error ${res.status}`)
    return data
  }

  const app = await getClient()
  try {
    const result = await app.predict('/ask_json', {
      message: question,
      history_json: JSON.stringify(history),
    })
    const data = result.data[0] || {}
    let answer = String(data.answer ?? '')
    if (data.tool_used) answer += `\n\nTool used: ${data.tool_used}`
    return { answer, sources: data.sources || [] }
  } catch {
    const result = await app.predict('/chat_fn', { message: question })
    return { answer: String(result.data[0] ?? ''), sources: [] }
  }
}

export async function uploadPdf(file) {
  if (isLocal) {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${FLASK}/upload`, { method: 'POST', body: formData })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data || data.error) throw new Error((data && data.error) || 'Upload failed')
    return data
  }

  const app = await getClient()
  const result = await app.predict('/upload_fn', { file })
  const message = String(result.data[1] ?? 'Uploaded')
  const m = message.match(/(\d+)\s*pages?\s*->\s*(\d+)\s*chunks?/i)
  return {
    message,
    filename: file.name,
    pages: m ? Number(m[1]) : undefined,
    chunks: m ? Number(m[2]) : undefined,
  }
}

export async function getStats() {
  if (isLocal) {
    const res = await fetch(`${FLASK}/stats`)
    const data = await res.json().catch(() => null)
    if (!res.ok || !data) throw new Error('Could not read stats')
    return String(data.message ?? JSON.stringify(data))
  }
  const app = await getClient()
  const result = await app.predict('/stats_fn', {})
  return String(result.data[0] ?? '')
}

export async function clearNotes() {
  if (isLocal) {
    const res = await fetch(`${FLASK}/clear`, { method: 'POST' })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data) throw new Error('Could not clear notes')
    return String(data.message ?? 'Cleared')
  }
  const app = await getClient()
  const result = await app.predict('/clear_fn', {})
  return String(result.data[1] ?? 'Cleared')
}
