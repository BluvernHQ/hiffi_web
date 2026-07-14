import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getAnalytics } from "firebase/analytics"

const firebaseConfig = {
  apiKey: "AIzaSyC_N-0rUCVDZKIz0qxIUagHiS5V0t0iMLo",
  authDomain: "hiffi-d003f.firebaseapp.com",
  projectId: "hiffi-d003f",
  storageBucket: "hiffi-d003f.firebasestorage.app",
  messagingSenderId: "488334531782",
  appId: "1:488334531782:web:360dc46ee3009eb43c0bc7",
  measurementId: "G-NVEG22FGFX",
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const auth = getAuth(app)

// Only initialize analytics on client side
let analytics
if (typeof window !== "undefined") {
  const isProdEnv = (process.env.NEXT_PUBLIC_ENV || "beta").toLowerCase() === "prod"
  if (isProdEnv) {
    analytics = getAnalytics(app)
  }
}

export { app, auth, analytics }
