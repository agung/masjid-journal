import { getSession } from '@/lib/auth/guards'
import { db } from '@/lib/db'
import { transaction, member } from '@/drizzle/schema'
import { env } from 'cloudflare:workers'
import { and, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

const MAX_SIZE_BYTES = 5 * 1024 * 1024

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const form = await req.formData()
    const file = form.get('file')
    const transactionId = String(form.get('transactionId') ?? '')
    if (!(file instanceof File) || !transactionId) return NextResponse.json({ error: 'File atau transaksi tidak ditemukan' }, { status: 400 })
    if (file.type !== 'image/webp' && !['image/jpeg', 'image/png'].includes(file.type)) return NextResponse.json({ error: 'Format file tidak didukung' }, { status: 400 })
    if (file.size > MAX_SIZE_BYTES) return NextResponse.json({ error: 'Ukuran file terlalu besar. Maksimal 5MB.' }, { status: 400 })
    const [tx] = await db.select().from(transaction).where(eq(transaction.id, transactionId)).limit(1)
    if (!tx) return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 })
    const [membership] = await db.select({ id: member.id }).from(member).where(and(eq(member.userId, session.user.id), eq(member.organizationId, tx.organizationId))).limit(1)
    if (!membership) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

    const key = `${tx.organizationId}/${tx.id}/${crypto.randomUUID()}.webp`
    await env.PROOF_BUCKET.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } })
    try {
      await db.update(transaction).set({ proofStoragePath: key, proofPublicUrl: null }).where(and(eq(transaction.id, tx.id), eq(transaction.organizationId, tx.organizationId)))
    } catch (error) {
      await env.PROOF_BUCKET.delete(key)
      throw error
    }
    if (tx.proofStoragePath) await env.PROOF_BUCKET.delete(tx.proofStoragePath)
    return NextResponse.json({ transactionId: tx.id, previewUrl: `/api/proofs/${encodeURIComponent(key)}` })
  } catch (error) {
    console.error('[upload-proof]', error)
    return NextResponse.json({ error: 'Upload gagal. Silakan coba lagi.' }, { status: 500 })
  }
}
