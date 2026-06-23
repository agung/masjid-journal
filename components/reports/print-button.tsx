'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-xl transition-colors no-print dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300"
    >
      🖨️ Cetak
    </button>
  )
}
