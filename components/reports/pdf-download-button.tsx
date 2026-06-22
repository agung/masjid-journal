'use client'

import { useState } from 'react'
import { FileDown, X, Loader2 } from 'lucide-react'

interface PdfDownloadButtonProps {
  year: number
  month: number
}

export function PdfDownloadButton({ year, month }: PdfDownloadButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const pdfUrl = `/api/reports/pdf?year=${year}&month=${month}`

  function openModal() {
    setIsOpen(true)
    setIsLoading(true)
  }

  function closeModal() {
    setIsOpen(false)
    setIsLoading(false)
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={openModal}
        className="flex items-center gap-1.5 text-sm bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-xl transition-colors no-print"
      >
        <FileDown size={15} />
        PDF
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal container */}
          <div className="relative z-10 w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
              <div>
                <h2 className="text-base font-bold text-gray-900">Preview Laporan PDF</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Periksa laporan sebelum mengunduh
                </p>
              </div>
              <button
                onClick={closeModal}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                aria-label="Tutup preview"
              >
                <X size={16} />
              </button>
            </div>

            {/* iframe body */}
            <div className="relative flex-1 min-h-0 bg-gray-100">
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-50">
                  <Loader2 size={28} className="animate-spin text-green-600" />
                  <p className="text-sm text-gray-500">Memuat preview PDF…</p>
                </div>
              )}
              <iframe
                src={pdfUrl}
                title="Preview Laporan PDF"
                className="w-full h-full border-0"
                style={{ minHeight: '60vh' }}
                onLoad={() => setIsLoading(false)}
              />
            </div>

            {/* Mobile fallback */}
            <p className="text-xs text-center text-gray-400 px-4 py-1.5 bg-gray-50 border-t sm:hidden">
              Preview tidak muncul? Gunakan tombol download di bawah.
            </p>

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t shrink-0">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <a
                href={pdfUrl}
                download
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors"
              >
                <FileDown size={15} />
                Download PDF
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
