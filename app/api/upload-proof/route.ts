import { getSession } from '@/lib/auth/guards'
import { db } from '@/lib/db'
import { transaction, member } from '@/drizzle/schema'
import { env } from 'cloudflare:workers'
import { and, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

const MAX_SIZE_BYTES = 10 * 1024 * 1024
const MAX_PHOTO_SIZE_BYTES = 1 * 1024 * 1024
const ALLOWED_TYPES: Record<string, { contentType: string; extension: string }> = {
  'image/webp': { contentType: 'image/webp', extension: 'webp' },
  'application/pdf': { contentType: 'application/pdf', extension: 'pdf' },
  'application/msword': { contentType: 'application/msword', extension: 'doc' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', extension: 'docx' },
  'application/vnd.ms-excel': { contentType: 'application/vnd.ms-excel', extension: 'xls' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', extension: 'xlsx' },
  'application/vnd.ms-powerpoint': { contentType: 'application/vnd.ms-powerpoint', extension: 'ppt' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', extension: 'pptx' },
  'text/plain': { contentType: 'text/plain', extension: 'txt' },
  'text/csv': { contentType: 'text/csv', extension: 'csv' },
  'application/rtf': { contentType: 'application/rtf', extension: 'rtf' },
  'text/rtf': { contentType: 'application/rtf', extension: 'rtf' },
}
const EXTENSION_TYPES: Record<string, string> = {
  webp: 'image/webp', pdf: 'application/pdf', doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain', csv: 'text/csv', rtf: 'application/rtf',
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const form = await req.formData()
    const file = form.get('file')
    const transactionId = String(form.get('transactionId') ?? '')
    if (!(file instanceof File) || !transactionId) return NextResponse.json({ error: 'File atau transaksi tidak ditemukan' }, { status: 400 })
    const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
    const contentType = ALLOWED_TYPES[file.type]?.contentType ??
      ((!file.type || file.type === 'application/octet-stream') ? EXTENSION_TYPES[extension] : undefined)
    const allowed = contentType ? ALLOWED_TYPES[contentType] : null
    if (!allowed || (file.type && file.type !== contentType && !(extension === 'rtf' && file.type === 'text/rtf'))) return NextResponse.json({ error: 'Format file tidak didukung' }, { status: 400 })
    if (file.size > MAX_SIZE_BYTES) return NextResponse.json({ error: 'Ukuran file terlalu besar. Maksimal 10 MB.' }, { status: 400 })
    if (contentType.startsWith('image/') && file.size > MAX_PHOTO_SIZE_BYTES) return NextResponse.json({ error: 'Foto terlalu besar setelah dikompres. Maksimal 1 MB.' }, { status: 400 })
    const [tx] = await db.select().from(transaction).where(eq(transaction.id, transactionId)).limit(1)
    if (!tx) return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 })
    const [membership] = await db.select({ id: member.id }).from(member).where(and(eq(member.userId, session.user.id), eq(member.organizationId, tx.organizationId))).limit(1)
    if (!membership) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

    const key = `${tx.id}.${allowed.extension}`
    await env.PROOF_BUCKET.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: allowed.contentType } })
    try {
      await db.update(transaction).set({ proofStoragePath: key, proofPublicUrl: null }).where(and(eq(transaction.id, tx.id), eq(transaction.organizationId, tx.organizationId)))
    } catch (error) {
      // If the extension is unchanged, this key may already be the transaction's
      // current proof. Do not delete the object that the database still references.
      if (tx.proofStoragePath !== key) await env.PROOF_BUCKET.delete(key)
      throw error
    }
    if (tx.proofStoragePath && tx.proofStoragePath !== key) await env.PROOF_BUCKET.delete(tx.proofStoragePath)
    return NextResponse.json({ transactionId: tx.id, previewUrl: `/api/proofs/${encodeURIComponent(key)}` })
  } catch (error) {
    console.error('[upload-proof]', error)
    return NextResponse.json({ error: 'Upload gagal. Silakan coba lagi.' }, { status: 500 })
  }
}
