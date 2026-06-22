'use client'

import { FileDown } from 'lucide-react'

interface PdfDownloadButtonProps {
  year: number
  month: number
}

export function PdfDownloadButton({ year, month }: PdfDownloadButtonProps) {
  return (
    <a
      href={`/api/reports/pdf?year=${year}&month=${month}`}
      download
      className="flex items-center gap-1.5 text-sm bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-xl transition-colors no-print"
    >
      <FileDown size={15} />
      PDF
    </a>
  )
}
