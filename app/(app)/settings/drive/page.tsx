import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Setup Google Drive',
}

export default async function DriveSetupPage() {
  const currentProvider = process.env.STORAGE_PROVIDER ?? 'supabase'

  // Check which env vars are set
  const hasDriveClientId = !!(process.env.GOOGLE_DRIVE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID)
  const hasDriveClientSecret = !!(process.env.GOOGLE_DRIVE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET)
  const hasDriveRefreshToken = !!process.env.GOOGLE_DRIVE_REFRESH_TOKEN
  const hasDriveFolderId = !!process.env.GOOGLE_DRIVE_FOLDER_ID
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabaseKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY

  return (
    <div className="p-4 max-w-md mx-auto pb-24">
      <h1 className="text-xl font-bold mb-1 dark:text-gray-100">Penyimpanan Bukti</h1>
      <p className="text-sm text-gray-500 mb-6 dark:text-gray-400">
        Pilih tempat penyimpanan foto bukti transaksi
      </p>

      {/* Current provider */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6 dark:bg-blue-950 dark:border-blue-900">
        <p className="text-xs text-blue-600 font-medium mb-1">Provider Aktif</p>
        <p className="text-sm font-semibold text-blue-800">
          {currentProvider === 'google_drive' ? '☁️ Google Drive' : '🗄️ Supabase Storage'}
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Ubah dengan set env <code className="bg-blue-100 px-1 rounded">STORAGE_PROVIDER</code>
        </p>
      </div>

      {/* Google Drive Setup */}
      <div className="bg-white border rounded-2xl p-5 mb-4 dark:bg-gray-900">
        <h2 className="font-bold text-base mb-1">☁️ Google Drive</h2>
        <p className="text-sm text-gray-500 mb-4 dark:text-gray-400">15 GB — pakai akun Google pribadi</p>

        <div className="space-y-4">
          {/* Step 1 */}
          <div className="flex gap-3">
            <span className="h-6 w-6 rounded-full bg-gray-200 text-gray-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 dark:bg-gray-700 dark:text-gray-300">1</span>
            <div className="min-w-0">
              <p className="text-sm font-medium">Cek env di Vercel/ .env.local</p>
              <div className="mt-1 space-y-1">
                <EnvCheck label="GOOGLE_CLIENT_ID" ok={hasDriveClientId} />
                <EnvCheck label="GOOGLE_CLIENT_SECRET" ok={hasDriveClientSecret} />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Biasanya sudah terisi dari setup SSO.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-3">
            <span className="h-6 w-6 rounded-full bg-gray-200 text-gray-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 dark:bg-gray-700 dark:text-gray-300">2</span>
            <div className="min-w-0">
              <p className="text-sm font-medium">Buat folder di Google Drive</p>
              <ol className="text-xs text-gray-500 mt-1 list-decimal list-inside space-y-0.5 dark:text-gray-400">
                <li>Buka <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">drive.google.com</a></li>
                <li>Buat folder baru, beri nama <code className="bg-gray-100 px-1 rounded dark:bg-gray-800 dark:text-gray-300">Bukti Transaksi Masjid</code></li>
                <li>Buka folder, lihat URL — salin ID dari <code className="bg-gray-100 px-1 rounded dark:bg-gray-800 dark:text-gray-300">/folders/INI_ADALAH_ID</code></li>
                <li>Simpan sebagai <code className="bg-gray-100 px-1 rounded dark:bg-gray-800 dark:text-gray-300">GOOGLE_DRIVE_FOLDER_ID</code></li>
              </ol>
              <EnvCheck label="GOOGLE_DRIVE_FOLDER_ID" ok={hasDriveFolderId} />
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-3">
            <span className="h-6 w-6 rounded-full bg-gray-200 text-gray-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 dark:bg-gray-700 dark:text-gray-300">3</span>
            <div className="min-w-0">
              <p className="text-sm font-medium">Tambahkan redirect URI di Google Cloud</p>
              <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">Buka Google Cloud Console → <strong>APIs & Services → Credentials</strong> → klik OAuth Client kamu → <strong>Authorized redirect URIs</strong>, tambahkan:</p>
              <pre className="bg-gray-100 rounded-lg p-2 text-xs font-mono mt-1 text-gray-700 break-all dark:bg-gray-800 dark:text-gray-300">https://{process.env.VERCEL_URL ? process.env.VERCEL_URL + '/api/drive-setup/callback' : 'domain-anda.vercel.app/api/drive-setup/callback'}</pre>
              <p className="text-xs text-gray-400 mt-1">Untuk development lokal, tambahkan juga: <code className="bg-gray-100 px-1 rounded dark:bg-gray-800 dark:text-gray-300">http://localhost:3000/api/drive-setup/callback</code></p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-3">
            <span className="h-6 w-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">4</span>
            <div className="min-w-0">
              <p className="text-sm font-medium mb-2">Dapatkan Refresh Token</p>
              <a
                href="/api/drive-setup"
                className="inline-block bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                🔗 Hubungkan Google Drive
              </a>
              <p className="text-xs text-gray-500 mt-2 dark:text-gray-400">
                Klik tombol di atas → login dengan akun pemilik folder Drive → setujui akses → salin refresh token yang muncul.
              </p>
              <EnvCheck label="GOOGLE_DRIVE_REFRESH_TOKEN" ok={hasDriveRefreshToken} />
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex gap-3">
            <span className="h-6 w-6 rounded-full bg-gray-200 text-gray-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 dark:bg-gray-700 dark:text-gray-300">5</span>
            <div className="min-w-0">
              <p className="text-sm font-medium">Set STORAGE_PROVIDER & redeploy</p>
              <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">Di Vercel, tambahkan semua env Drive, lalu set:</p>
              <pre className="bg-gray-100 rounded-lg p-2 text-xs font-mono mt-1 text-gray-700 dark:bg-gray-800 dark:text-gray-300">STORAGE_PROVIDER=google_drive</pre>
              <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">Redeploy Vercel setelah semua env terisi.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Supabase Storage info */}
      <div className="bg-white border rounded-2xl p-5 mb-6 dark:bg-gray-900">
        <h2 className="font-bold text-base mb-1">🗄️ Supabase Storage (Default)</h2>
        <p className="text-sm text-gray-500 mb-3 dark:text-gray-400">1 GB — gratis, setup cepat</p>

        <div className="space-y-1 mb-3">
          <EnvCheck label="NEXT_PUBLIC_SUPABASE_URL" ok={hasSupabaseUrl} />
          <EnvCheck label="SUPABASE_SERVICE_ROLE_KEY" ok={hasSupabaseKey} />
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Setup bucket <code className="bg-gray-100 px-1 rounded dark:bg-gray-800 dark:text-gray-300">bukti-transaksi</code> di Supabase Dashboard → Storage.
          <br />
          <Link href="/settings" className="text-blue-600 underline">Kembali ke settings utama →</Link>
        </p>
      </div>
    </div>
  )
}

function EnvCheck({ label, ok }: { label: string; ok: boolean }) {
  return (
    <p className="flex items-center gap-1.5 text-xs">
      <span className={ok ? 'text-green-600' : 'text-red-400'}>
        {ok ? '✅' : '⬜'}
      </span>
      <code className={ok ? 'text-green-700' : 'text-gray-400'}>{label}</code>
      <span className="text-gray-400">{ok ? 'terisi' : 'belum'}</span>
    </p>
  )
}
