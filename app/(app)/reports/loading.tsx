export default function ReportsLoading() {
  return (
    <div className="p-4 max-w-2xl mx-auto pb-24 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg mb-1" />
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>

      {/* Month navigation */}
      <div className="flex gap-2 mb-6">
        <div className="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>

      {/* Summary grid: 4 cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-20" />
        <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-20" />
        <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-20" />
        <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-20" />
      </div>

      {/* Income by category */}
      <div className="mb-6">
        <div className="h-3 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
        <div className="bg-white border rounded-xl dark:bg-gray-900 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 border-b last:border-b-0">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Expense by category */}
      <div className="mb-6">
        <div className="h-3 w-44 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
        <div className="bg-white border rounded-xl dark:bg-gray-900 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 border-b last:border-b-0">
              <div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Transaction list */}
      <div>
        <div className="h-3 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
        <div className="bg-white border rounded-xl dark:bg-gray-900 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3.5 border-b last:border-b-0">
              <div className="flex-1">
                <div className="flex gap-2 mb-1">
                  <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
                <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded ml-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
