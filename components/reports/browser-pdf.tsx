'use client'

import { useEffect, useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'

export interface BrowserReportPdfProps {
  orgName: string
  year: number
  month: number
  generatedAt: string
  accountSummary: {
    cashHolders: { id: string; name: string; currentBalance: number; kind: string | null }[]
    banks: { id: string; name: string; currentBalance: number; kind: string | null }[]
    totalCash: number
    totalBank: number
    totalAll?: number
  }
  movements: {
    movementId: string
    direction: string | null
    amount: number | null
    balanceAfter: number | null
    accountName: string
    accountKind: string | null
    transactionDate: string
    transactionNo: string
    description: string | null
  }[]
}

export function BrowserPdf({ data }: { data: BrowserReportPdfProps }) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    let objectUrl: string | null = null
    void (async () => {
      try {
        const [{ pdf }, React, { TransactionReportPdf }] = await Promise.all([
          import('@react-pdf/renderer'), import('react'), import('@/components/pdf/transaction-report-pdf'),
        ])
        const blob = await pdf(React.createElement(TransactionReportPdf, data) as never).toBlob()
        if (!active) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      } catch (e) {
        console.error('[browser-pdf]', e)
        if (active) setError('PDF gagal dibuat. Muat ulang halaman untuk mencoba lagi.')
      }
    })()
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [data])

  if (error) return <p className="p-4 text-sm text-red-600">{error}</p>
  if (!url) return <p className="flex items-center justify-center gap-2 p-6 text-sm text-gray-500"><Loader2 className="animate-spin" size={16} /> Menyiapkan PDF...</p>
  const filename = `laporan-transaksi-${data.year}-${String(data.month).padStart(2, '0')}.pdf`
  return <div className="flex h-full min-h-0 flex-col">
    <div className="flex justify-end border-b px-4 py-2"><a href={url} download={filename} className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white"><FileDown size={15} /> Download PDF</a></div>
    <iframe src={url} title="Preview laporan" className="min-h-0 flex-1 border-0" />
  </div>
}
