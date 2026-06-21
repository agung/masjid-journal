export default function NewTransactionLoading() {
  return (
    <div className="p-4 max-w-md mx-auto animate-pulse">
      {/* Type selector buttons */}
      <div className="space-y-2 mb-4">
        <div className="h-3 w-32 bg-gray-200 rounded mb-3" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100">
            <div className="h-10 w-10 bg-gray-200 rounded-xl" />
            <div className="h-5 w-28 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
