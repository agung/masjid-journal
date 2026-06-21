import { createAuthClient } from 'better-auth/react'
import { organizationClient } from 'better-auth/client/plugins'

// In development, derive baseURL from the browser's current origin so
// the client works when opened from a phone on the same Wi-Fi
// (http://192.168.x.x:3000) without needing to hard-code the IP.
// In production, NEXT_PUBLIC_APP_URL is the deployed domain.
const baseURL =
  typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')

export const authClient = createAuthClient({
  baseURL,
  plugins: [
    organizationClient(),
  ],
})

export const {
  signIn,
  signOut,
  signUp,
  useSession,
} = authClient
