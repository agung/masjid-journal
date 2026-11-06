import Link from 'next/link'
import { eq } from 'drizzle-orm'
import { BrowserPdf, type BrowserReportPdfProps } from '@/components/reports/browser-pdf'
import { getActiveOrganizationContext } from '@/lib/auth/guards'
import { db } from '@/lib/db'
import { organization } from '@/drizzle/schema'
import { getAccountSummary, getMovementsForReport } from '@/lib/server/reports'
import { formatDate } from '@/lib/formatters'

export const dynamic = 'force-dynamic'

export default async function ReportPreviewPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const ctx = await getActiveOrganizationContext()
  const orgId = ctx.activeOrganizationId
  if (!orgId) return <div className="p-4 text-sm text-gray-500">Belum ada organisasi aktif. <Link href="/dashboard" className="text-green-600">Dashboard</Link></div>
  const { month, year } = await searchParams
  const now = new Date()
  const pYear = year ? Number(year) : now.getFullYear()
  const pMonth = month ? Number(month) : now.getMonth() + 1
  const [org, summary, movements] = await Promise.all([
    db.select({ name: organization.name }).from(organization).where(eq(organization.id, orgId)).limit(1).then((rows) => rows[0]),
    getAccountSummary(orgId), getMovementsForReport(orgId, pYear, pMonth),
  ])
  if (!org) return <div className="p-4">Organisasi tidak ditemukan.</div>
  const data: BrowserReportPdfProps = {
    orgName: org.name, year: pYear, month: pMonth, generatedAt: formatDate(new Date()),
    accountSummary: {
      cashHolders: summary.cashHolders.map((a) => ({ id: a.id, name: a.name, kind: a.kind, currentBalance: Number(a.currentBalance ?? 0) })),
      banks: summary.banks.map((a) => ({ id: a.id, name: a.name, kind: a.kind, currentBalance: Number(a.currentBalance ?? 0) })),
      totalCash: summary.totalCash, totalBank: summary.totalBank,
    },
    movements: movements.filter((m) => m.transactionType !== 'transfer').map((m) => ({ ...m, amount: Number(m.amount ?? 0), balanceAfter: Number(m.balanceAfter ?? 0) })),
  }
  const monthLabel = new Date(pYear, pMonth - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })
  return <div className="flex h-screen flex-col">
    <div className="flex items-center justify-between border-b bg-white px-4 py-3 dark:bg-gray-900">
      <div><p className="text-sm font-semibold">Preview Laporan</p><p className="text-xs text-gray-500">{monthLabel}</p></div>
      <Link href={`/reports?year=${pYear}&month=${pMonth}`} className="text-sm text-green-700">Kembali</Link>
    </div>
    <div className="min-h-0 flex-1 bg-gray-100 dark:bg-gray-800"><BrowserPdf data={data} /></div>
  </div>
}
