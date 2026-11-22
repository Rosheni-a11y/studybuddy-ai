import {
  collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, limit,
} from 'firebase/firestore'
import { db } from './firebase'

const chatsRef = (uid) => collection(db, 'users', uid, 'chats')

export function watchChats(uid, callback) {
  const q = query(chatsRef(uid), orderBy('updatedAt', 'desc'), limit(30))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export function newChatId(uid) {
  return doc(chatsRef(uid)).id
}

export async function saveChat(uid, chatId, messages) {
  const first = messages.find((m) => m.role === 'user')
  const title = (first?.content || 'New chat').slice(0, 60)
  const clean = JSON.parse(JSON.stringify(messages))
  await setDoc(doc(chatsRef(uid), chatId), { title, messages: clean, updatedAt: Date.now() })
}

export async function deleteChat(uid, chatId) {
  await deleteDoc(doc(chatsRef(uid), chatId))
}
