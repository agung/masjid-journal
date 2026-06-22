import { google } from 'googleapis'

/**
 * GET /api/drive-setup/callback
 * Handles Google OAuth callback, exchanges code for tokens,
 * and displays the refresh token to the user.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET

  // If user denied access
  if (error) {
    return renderResult(false, `Google returned an error: ${error}`, '')
  }

  if (!code) {
    return renderResult(false, 'Missing authorization code in callback URL.', '')
  }

  if (!clientId || !clientSecret) {
    return renderResult(false, 'OAuth credentials not configured.', '')
  }

  try {
    const origin = new URL(request.url).origin
    const callbackUrl = `${origin}/api/drive-setup/callback`

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, callbackUrl)
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.refresh_token) {
      return renderResult(
        false,
        'No refresh token returned. Make sure you approved the consent screen (not just login).',
        ''
      )
    }

    return renderResult(true, '', tokens.refresh_token)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return renderResult(false, `Failed to exchange code: ${msg}`, '')
  }
}

function renderResult(success: boolean, message: string, refreshToken: string) {
  const body = success
    ? `
      <h1>✅ Berhasil!</h1>
      <p>Salin token berikut lalu tambahkan ke <code>.env.local</code> atau Vercel Environment Variables:</p>
      <div style="background:#f3f4f6;border-radius:8px;padding:1rem;margin:1rem 0;word-break:break-all;font-family:monospace;font-size:14px;">
        GOOGLE_DRIVE_REFRESH_TOKEN=${refreshToken}
      </div>
      <button onclick="navigator.clipboard.writeText('${refreshToken}')" style="padding:8px 16px;background:#2563eb;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;">
        📋 Salin ke clipboard
      </button>
      <hr style="margin:1.5rem 0">
      <p>Langkah selanjutnya:</p>
      <ol>
        <li>Salin token di atas</li>
        <li>Tambahkan ke Vercel → Settings → Environment Variables → Production:
          <br><code>GOOGLE_DRIVE_REFRESH_TOKEN</code>
        </li>
        <li>Tambahkan juga env (sudah ada kalau pakai SSO):
          <br><code>GOOGLE_DRIVE_CLIENT_ID</code>
          <br><code>GOOGLE_DRIVE_CLIENT_SECRET</code>
          <br><code>GOOGLE_DRIVE_FOLDER_ID</code>
        </li>
        <li>Set <code>STORAGE_PROVIDER=google_drive</code></li>
        <li>Redeploy Vercel</li>
      </ol>
      <p><a href="/settings/drive">← Kembali ke settings</a></p>
    `
    : `
      <h1>❌ Gagal</h1>
      <p style="color:#dc2626">${message}</p>
      <p>Kemungkinan penyebab:</p>
      <ul>
        <li>Kamu belum menyetujui akses Drive (klik Allow)</li>
        <li>Email kamu belum terdaftar sebagai test user</li>
        <li>Consent screen belum dipublish</li>
      </ul>
      <p><a href="/settings/drive">← Coba lagi</a></p>
    `

  return new Response(
    `<html lang="id">
      <head><meta charset="utf-8"><title>Drive Setup</title></head>
      <body style="font-family:sans-serif;padding:2rem;max-width:640px;margin:auto;line-height:1.6">
        ${body}
      </body>
    </html>`,
    { headers: { 'content-type': 'text/html; charset=utf-8' } }
  )
}
