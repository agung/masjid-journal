import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { member, organization, session as authSession } from '@/drizzle/schema'
import { getAccountSummary, getMovementsForReport } from '@/lib/server/reports'
import { formatDate } from '@/lib/formatters'

// @react-pdf/renderer requires Node.js runtime (not Edge)
export const runtime = 'nodejs'

const querySchema = z.object({
  year: z
    .string()
    .regex(/^\d{4}$/, 'year harus 4 digit')
    .transform(Number)
    .refine((n) => n >= 2000 && n <= 2100, 'year harus antara 2000–2100'),
  month: z
    .string()
    .regex(/^\d{1,2}$/, 'month harus angka')
    .transform(Number)
    .refine((n) => n >= 1 && n <= 12, 'month harus antara 1–12'),
})

export async function GET(req: NextRequest) {
  // ── 1. Validate query params ────────────────────────────────────
  const { searchParams } = req.nextUrl
  const parsed = querySchema.safeParse({
    year: searchParams.get('year') ?? '',
    month: searchParams.get('month') ?? '',
  })

  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: parsed.error.errors[0]?.message ?? 'Parameter tidak valid' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const { year, month } = parsed.data

  // ── 2. Authenticate ───────────────────────────────────────────
  const sessionData = await auth.api.getSession({ headers: req.headers })
  if (!sessionData) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const userId = sessionData.user.id

  // ── 3. Resolve active organization ──────────────────────────────
  const sessionRecord = sessionData.session as unknown as {
    id?: string
    activeOrganizationId?: string | null
  }
  let activeOrgId = sessionRecord.activeOrganizationId ?? null

  if (!activeOrgId) {
    // Fall back to first membership (mirrors getActiveOrganizationContext logic)
    const [firstMembership] = await db
      .select({ organizationId: member.organizationId })
      .from(member)
      .where(eq(member.userId, userId))
      .limit(1)

    activeOrgId = firstMembership?.organizationId ?? null

    // Persist to session if we found one
    if (activeOrgId && sessionRecord.id) {
      await db
        .update(authSession)
        .set({ activeOrganizationId: activeOrgId, updatedAt: new Date() })
        .where(eq(authSession.id, sessionRecord.id))
    }
  }

  if (!activeOrgId) {
    return new Response(
      JSON.stringify({ error: 'Tidak ada organisasi aktif' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // ── 4. Verify membership ───────────────────────────────────────
  const [membership] = await db
    .select({ role: member.role })
    .from(member)
    .where(and(eq(member.userId, userId), eq(member.organizationId, activeOrgId)))
    .limit(1)

  if (!membership) {
    return new Response(
      JSON.stringify({ error: 'Akses ditolak' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // ── 5. Fetch data ─────────────────────────────────────────────
  const [org, accountSummary, movements] = await Promise.all([
    db
      .select({ name: organization.name })
      .from(organization)
      .where(eq(organization.id, activeOrgId))
      .limit(1)
      .then((rows) => rows[0]),
    getAccountSummary(activeOrgId),
    getMovementsForReport(activeOrgId, year, month),
  ])

  if (!org) {
    return new Response(
      JSON.stringify({ error: 'Organisasi tidak ditemukan' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // ── 6. Render PDF (lazy-import keeps it out of the webpack graph) ──
  const generatedAt = formatDate(new Date())

  // Dynamic import prevents webpack from bundling @react-pdf/renderer.
  // serverExternalPackages in next.config.ts ensures Next.js externalises it,
  // but the lazy import is the belt-and-braces safeguard against bundle tracing.
  const { renderToBuffer } = await import('@react-pdf/renderer')
  const React = await import('react')
  const { TransactionReportPdf } = await import('@/components/pdf/transaction-report-pdf')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.default.createElement(TransactionReportPdf as any, {
    orgName: org.name,
    year,
    month,
    accountSummary,
    movements: movements
      .filter((m) => m.transactionType !== 'transfer')
      .map((m) => ({
        ...m,
        amount: Number(m.amount ?? 0),
        balanceAfter: Number(m.balanceAfter ?? 0),
      })),
    generatedAt,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(element as any)

  // Copy Buffer into a plain ArrayBuffer for the Web Response API
  const arrayBuffer = pdfBuffer.buffer.slice(
    pdfBuffer.byteOffset,
    pdfBuffer.byteOffset + pdfBuffer.byteLength
  ) as ArrayBuffer
  const blob = new Blob([arrayBuffer], { type: 'application/pdf' })

  const filename = `laporan-transaksi-${year}-${String(month).padStart(2, '0')}.pdf`
  // ?download=1 → force browser save dialog; omit → inline for iframe preview
  const isDownload = searchParams.get('download') === '1'
  const disposition = isDownload
    ? `attachment; filename="${filename}"`
    : `inline; filename="${filename}"`

  return new Response(blob, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': disposition,
      'Content-Length': String(pdfBuffer.byteLength),
    },
  })
}
