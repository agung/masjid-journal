import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'
import { google } from 'googleapis'

/**
 * GET /api/drive-setup
 * Initiates Google OAuth flow for Drive access.
 * Reads credentials from env (GOOGLE_DRIVE_CLIENT_ID or fallback to GOOGLE_CLIENT_ID).
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return new Response(
      `<html><body style="font-family:sans-serif;padding:2rem;max-width:600px;margin:auto">
        <h1>❌ OAuth credentials not found</h1>
        <p>Set <code>GOOGLE_DRIVE_CLIENT_ID</code> and <code>GOOGLE_DRIVE_CLIENT_SECRET</code>
        (or <code>GOOGLE_CLIENT_ID</code> / <code>GOOGLE_CLIENT_SECRET</code>) in environment variables.</p>
        <p><a href="/settings/drive">← Kembali</a></p>
      </body></html>`,
      { headers: { 'content-type': 'text/html; charset=utf-8' } }
    )
  }

  // Build the callback URL from the current request origin
  const origin = new URL(request.url).origin
  const callbackUrl = `${origin}/api/drive-setup/callback`

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, callbackUrl)

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/drive.file'],
  })

  redirect(authUrl)
}
