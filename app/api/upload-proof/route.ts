import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'
import { uploadProofToDrive } from '@/lib/server/storage'

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']

/**
 * POST /api/upload-proof
 * Accepts: multipart/form-data with field "file"
 * Returns: { fileId, webViewLink, webContentLink }
 */
export async function POST(req: NextRequest) {
  // Auth check via session cookie
  const session = getSessionCookie(req)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })
    }

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP.' },
        { status: 400 }
      )
    }

    // Validate size
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Ukuran file terlalu besar. Maksimal 5MB.' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Build a clean filename: timestamp + original name
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const fileName = `${timestamp}-${safeName}`

    const result = await uploadProofToDrive({
      buffer,
      mimeType: file.type,
      fileName,
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error('[upload-proof]', err)
    return NextResponse.json(
      { error: 'Upload gagal. Pastikan konfigurasi Google Drive sudah benar.' },
      { status: 500 }
    )
  }
}
