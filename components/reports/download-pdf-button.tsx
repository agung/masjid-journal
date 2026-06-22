'use client'

import { useState } from 'react'
import { FileDown, Loader2, Check } from 'lucide-react'

interface DownloadPdfButtonProps {
  downloadUrl: string
}

export function DownloadPdfButton({ downloadUrl }: DownloadPdfButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')

  async function handleDownload() {
    if (state !== 'idle') return
    setState('loading')

    try {
      // Fetch the PDF as a blob so we can detect when it's fully received
      // before triggering the save dialog
      const res = await fetch(downloadUrl)
      if (!res.ok) throw new Error('Gagal mengunduh')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = downloadUrl.match(/laporan[^"]+\.pdf/) ? downloadUrl.split('?')[0].split('/').pop()! : 'laporan.pdf'

      // Extract filename from Content-Disposition if available
      const disposition = res.headers.get('Content-Disposition')
      const match = disposition?.match(/filename="([^"]+)"/);
      if (match?.[1]) a.download = match[1]

      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setState('done')
      // Reset back to idle after a short delay
      setTimeout(() => setState('idle'), 2500)
    } catch {
      setState('idle')
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={state !== 'idle'}
      className="flex items-center gap-1.5 text-sm bg-green-600 hover:bg-green-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-xl transition-colors"
    >
      {state === 'loading' ? (
        <>
          <Loader2 size={15} className="animate-spin" />
          Mengunduh...
        </>
      ) : state === 'done' ? (
        <>
          <Check size={15} />
          Selesai
        </>
      ) : (
        <>
          <FileDown size={15} />
          Download PDF
        </>
      )}
    </button>
  )
}
