import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"

/** Requires youtube.readonly on the Firebase/Google OAuth consent screen. */
const YOUTUBE_READONLY_SCOPE = "https://www.googleapis.com/auth/youtube.readonly"

export type YoutubeGoogleAuthResult = {
  accessToken: string
  email: string | null
}

export async function requestYoutubeReadonlyAccess(): Promise<YoutubeGoogleAuthResult> {
  const provider = new GoogleAuthProvider()
  provider.addScope(YOUTUBE_READONLY_SCOPE)
  provider.setCustomParameters({ prompt: "select_account" })

  try {
    const result = await signInWithPopup(auth, provider)
    const credential = GoogleAuthProvider.credentialFromResult(result)
    const accessToken = credential?.accessToken

    if (!accessToken) {
      throw new Error("Google did not return a YouTube access token.")
    }

    return {
      accessToken,
      email: result.user.email ?? null,
    }
  } finally {
    await signOut(auth).catch(() => {
      // Verification-only popup; don't leave a Firebase session behind.
    })
  }
}
