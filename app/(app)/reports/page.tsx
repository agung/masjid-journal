import { getActiveOrganizationContext } from '@/lib/auth/guards'
import { getMonthlyReport } from '@/lib/server/reports'
import { ReportContainer } from '@/components/reports/report-container'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const ctx = await getActiveOrganizationContext()
  const orgId = ctx.activeOrganizationId

  if (!orgId) {
    return <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Belum ada organisasi aktif. Buat di <a href="/dashboard" className="text-green-600">Dashboard</a>.</div>
  }

  const { month, year } = await searchParams
  const now = new Date()
  const pYear = year ? parseInt(year as string, 10) : now.getFullYear()
  const pMonth = month ? parseInt(month as string, 10) : now.getMonth() + 1

  const report = await getMonthlyReport(orgId, pYear, pMonth)

  const monthLabel = new Date(pYear, pMonth - 1).toLocaleString('id-ID', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <ReportContainer
        organizationId={orgId}
        report={report}
        pYear={pYear}
        pMonth={pMonth}
        monthLabel={monthLabel}
      />
    </div>
  )
}
