export function LedgerSkeleton({ showFilters = true }: { showFilters?: boolean }) {
  return (
    <div className="animate-pulse">
      {showFilters && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="h-6 w-36 bg-gray-200 dark:bg-gray-700 rounded-lg mb-1" />
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          </div>

          {/* Filter bar */}
          <div className="flex gap-2 mb-4">
            <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
        </>
      )}

      {/* Ledger rows */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white border rounded-xl dark:bg-gray-900 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-xl shrink-0" />
                <div>
                  <div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded mb-1.5" />
                  <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
              <div className="text-right">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-1.5 ml-auto" />
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded ml-auto" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
