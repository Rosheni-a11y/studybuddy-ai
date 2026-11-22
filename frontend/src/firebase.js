import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseOn = Boolean(cfg.apiKey && cfg.projectId && cfg.appId)

export let auth = null
export let db = null
export const googleProvider = new GoogleAuthProvider()

if (firebaseOn) {
  const app = initializeApp(cfg)
  auth = getAuth(app)
  db = getFirestore(app)
}
