export default function DashboardLoading() {
  return (
    <div className="p-4 max-w-2xl mx-auto animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg mb-1" />
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>

      {/* Summary card besar */}
      <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-32 mb-3" />

      {/* Monthly flow cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-20" />
        <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-20" />
      </div>

      {/* Account list */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-3">
          <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between bg-white border rounded-xl dark:bg-gray-900 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-3">
          <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white border rounded-xl dark:bg-gray-900 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                <div>
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
                  <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
