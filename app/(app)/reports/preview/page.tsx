import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getActiveOrganizationContext } from '@/lib/auth/guards'
import { DownloadPdfButton } from '@/components/reports/download-pdf-button'

export default async function ReportPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const ctx = await getActiveOrganizationContext()

  if (!ctx.activeOrganizationId) {
    return (
      <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
        Belum ada organisasi aktif.{' '}
        <Link href="/dashboard" className="text-green-600">Dashboard</Link>
      </div>
    )
  }

  const { month, year } = await searchParams
  const now = new Date()
  const pYear = year ? parseInt(year as string, 10) : now.getFullYear()
  const pMonth = month ? parseInt(month as string, 10) : now.getMonth() + 1

  const monthLabel = new Date(pYear, pMonth - 1).toLocaleString('id-ID', {
    month: 'long',
    year: 'numeric',
  })

  const previewUrl = `/api/reports/pdf?year=${pYear}&month=${pMonth}`
  const downloadUrl = `/api/reports/pdf?year=${pYear}&month=${pMonth}&download=1`

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white shrink-0 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <Link
            href={`/reports?year=${pYear}&month=${pMonth}`}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ChevronLeft size={16} />
            Kembali
          </Link>
          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight dark:text-gray-100">Preview Laporan</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{monthLabel}</p>
          </div>
        </div>
        <DownloadPdfButton downloadUrl={downloadUrl} />
      </div>

      {/* PDF iframe */}
      <div className="flex-1 bg-gray-200 dark:bg-gray-800">
        <iframe
          src={previewUrl}
          title={`Preview Laporan ${monthLabel}`}
          className="w-full h-full border-0"
        />
      </div>

      {/* Mobile fallback */}
      <div className="sm:hidden bg-amber-50 border-t border-amber-200 px-4 py-2.5 shrink-0 dark:bg-amber-950 dark:border-amber-900">
        <p className="text-xs text-amber-700 text-center dark:text-amber-300">
          Preview PDF mungkin tidak tampil di browser mobile. Gunakan tombol{' '}
          <strong>Download PDF</strong> di atas.
        </p>
      </div>
    </div>
  )
}
