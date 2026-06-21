export default function TransactionsLoading() {
  return (
    <div className="p-4 max-w-2xl mx-auto animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-6 w-36 bg-gray-200 rounded-lg mb-1" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>
        <div className="h-10 w-20 bg-gray-200 rounded-xl" />
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 mb-4">
        <div className="h-11 w-28 bg-gray-200 rounded-lg" />
        <div className="h-11 w-28 bg-gray-200 rounded-lg" />
        <div className="h-11 w-28 bg-gray-200 rounded-lg" />
      </div>

      {/* Ledger rows */}
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white border rounded-xl px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-gray-200 rounded-xl" />
                <div>
                  <div className="h-4 w-36 bg-gray-200 rounded mb-1" />
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="text-right">
                <div className="h-4 w-24 bg-gray-200 rounded mb-1" />
                <div className="h-3 w-16 bg-gray-200 rounded ml-auto" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
