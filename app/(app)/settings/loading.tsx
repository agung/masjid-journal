export default function SettingsLoading() {
  return (
    <div className="p-4 max-w-md mx-auto pb-24 animate-pulse">
      {/* User info card */}
      <div className="bg-white border rounded-2xl p-4 mb-6 flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-gray-200 shrink-0" />
        <div>
          <div className="h-4 w-32 bg-gray-200 rounded mb-1.5" />
          <div className="h-3 w-44 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Org badge */}
      <div className="bg-gray-200 rounded-xl h-14 mb-6" />

      {/* Menu sections */}
      <div className="space-y-4">
        <div>
          <div className="h-3 w-20 bg-gray-200 rounded mb-2" />
          <div className="bg-white border rounded-xl overflow-hidden">
            <div className="px-4 py-3.5 border-b"><div className="h-4 w-28 bg-gray-200 rounded" /></div>
            <div className="px-4 py-3.5"><div className="h-4 w-32 bg-gray-200 rounded" /></div>
          </div>
        </div>
        <div>
          <div className="h-3 w-24 bg-gray-200 rounded mb-2" />
          <div className="bg-white border rounded-xl overflow-hidden">
            <div className="px-4 py-3.5 border-b"><div className="h-4 w-28 bg-gray-200 rounded" /></div>
            <div className="px-4 py-3.5"><div className="h-4 w-24 bg-gray-200 rounded" /></div>
          </div>
        </div>
      </div>
    </div>
  )
}
