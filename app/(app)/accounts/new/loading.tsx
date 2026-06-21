export default function NewAccountLoading() {
  return (
    <div className="p-4 max-w-md mx-auto animate-pulse">
      {/* Kind selector */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        <div className="h-20 bg-gray-200 rounded-xl" />
        <div className="h-20 bg-gray-200 rounded-xl" />
      </div>

      {/* Form fields */}
      <div className="space-y-5">
        {[...Array(4)].map((_, i) => (
          <div key={i}>
            <div className="h-3 w-24 bg-gray-200 rounded mb-1.5" />
            <div className="h-10 bg-gray-200 rounded-xl" />
          </div>
        ))}

        {/* Submit button */}
        <div className="h-12 bg-gray-200 rounded-xl mt-2" />
      </div>
    </div>
  )
}
