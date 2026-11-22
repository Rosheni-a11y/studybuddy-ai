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

export async function askQuestion(question, history = [], userId = 'anonymous') {
  if (isLocal) {
    const res = await fetch(`${FLASK}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, user_id: userId }),
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
      user_id: userId,
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

export async function uploadPdf(file, userId = 'anonymous') {
  if (isLocal) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('user_id', userId)
    const res = await fetch(`${FLASK}/upload`, { method: 'POST', body: formData })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data || data.error) throw new Error((data && data.error) || 'Upload failed')
    return data
  }

  const app = await getClient()
  const result = await app.predict('/upload_user', { file, user_id: userId })
  const message = String(result.data[1] ?? 'Uploaded').replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim()
  const m = message.match(/(\d+)\s*pages?\s*->\s*(\d+)\s*chunks?/i)
  return {
    message,
    filename: file.name,
    pages: m ? Number(m[1]) : undefined,
    chunks: m ? Number(m[2]) : undefined,
  }
}

export async function getStats(userId = 'anonymous') {
  if (isLocal) {
    const res = await fetch(`${FLASK}/stats?user_id=${userId}`)
    const data = await res.json().catch(() => null)
    if (!res.ok || !data) throw new Error('Could not read stats')
    return String(data.message ?? JSON.stringify(data))
  }
  const app = await getClient()
  const result = await app.predict('/stats_user', { user_id: userId })
  return String(result.data[0] ?? '')
}

export async function clearNotes(userId = 'anonymous') {
  if (isLocal) {
    const res = await fetch(`${FLASK}/clear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data) throw new Error('Could not clear notes')
    return String(data.message ?? 'Cleared')
  }
  const app = await getClient()
  const result = await app.predict('/clear_user', { user_id: userId })
  return String(result.data[1] ?? 'Cleared').replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim()
}
