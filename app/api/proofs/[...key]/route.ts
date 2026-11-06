import { getSession } from '@/lib/auth/guards'
import { db } from '@/lib/db'
import { member, transaction } from '@/drizzle/schema'
import { env } from 'cloudflare:workers'
import { and, eq } from 'drizzle-orm'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  const session = await getSession()
  if (!session) return new Response('Unauthorized', { status: 401, headers: { 'Cache-Control': 'private, no-store' } })
  const key = (await params).key.join('/')
  const [tx] = await db.select({ id: transaction.id, organizationId: transaction.organizationId, proofStoragePath: transaction.proofStoragePath }).from(transaction).where(eq(transaction.proofStoragePath, key)).limit(1)
  if (!tx) return new Response('Not found', { status: 404 })
  const [membership] = await db.select({ id: member.id }).from(member).where(and(eq(member.userId, session.user.id), eq(member.organizationId, tx.organizationId))).limit(1)
  if (!membership) return new Response('Forbidden', { status: 403 })
  const object = await env.PROOF_BUCKET.get(key)
  if (!object) return new Response('Not found', { status: 404 })
  return new Response(object.body, { headers: { 'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream', 'Cache-Control': 'private, no-store', 'ETag': object.httpEtag } })
}
