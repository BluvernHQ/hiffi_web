import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getAnalytics } from "firebase/analytics"

const firebaseConfig = {
  apiKey: "AIzaSyB8nH1Cqyatc5lLGbQppUFzBpBSUAa2Lzg",
  authDomain: "hiffi-432a0.firebaseapp.com",
  projectId: "hiffi-432a0",
  storageBucket: "hiffi-432a0.firebasestorage.app",
  messagingSenderId: "13822028321",
  appId: "1:13822028321:web:5e715cea8c553d005f1160",
  measurementId: "G-9YS22FKD9T",
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const auth = getAuth(app)

// Only initialize analytics on client side
let analytics
if (typeof window !== "undefined") {
  analytics = getAnalytics(app)
}

export { app, auth, analytics }
