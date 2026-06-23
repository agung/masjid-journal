export default function AccountsLoading() {
  return (
    <div className="p-4 max-w-2xl mx-auto animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 w-36 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>

      {/* Summary grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-20" />
        <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-20" />
      </div>

      {/* Cash holders section */}
      <div className="mb-6">
        <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center justify-between bg-white border rounded-xl dark:bg-gray-900 px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                <div>
                  <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
                  <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Bank accounts section */}
      <div>
        <div className="h-3 w-28 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center justify-between bg-white border rounded-xl dark:bg-gray-900 px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                <div>
                  <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
                  <div className="h-3 w-36 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
