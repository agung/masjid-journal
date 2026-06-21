import { getActiveOrganizationContext } from '@/lib/auth/guards'
import { listAccounts } from '@/lib/server/accounts'
import { formatRupiah, formatDate } from '@/lib/formatters'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Wallet, Landmark } from 'lucide-react'
import type { MasjidAccount } from '@/drizzle/schema'

type AccountWithBalance = MasjidAccount & { currentBalance: number }

interface Props {
  params: Promise<{ id: string }>
}

export default async function AccountDetailPage({ params }: Props) {
  const { id } = await params
  const ctx = await getActiveOrganizationContext()
  const activeOrgId = ctx.activeOrganizationId

  const accounts: AccountWithBalance[] = activeOrgId
    ? (await listAccounts(activeOrgId)) as AccountWithBalance[]
    : []

  const account = accounts.find((a) => a.id === id)
  if (!account) notFound()

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center">
        <Link href="/accounts" className="text-gray-500 hover:text-gray-700 mr-3">
          ←
        </Link>
        <h1 className="text-xl font-bold">Detail Akun</h1>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="h-12 w-12 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
            {account.kind === 'cash_holder' ? <Wallet size={24} /> : <Landmark size={24} />}
          </span>
          <div>
            <h2 className="font-bold text-lg">{account.name}</h2>
            <p className="text-sm text-gray-500">
              {account.kind === 'cash_holder' ? 'Pemegang Kas' : 'Rekening Bank'}
            </p>
          </div>
          {!account.isActive && (
            <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
              Nonaktif
            </span>
          )}
        </div>

        <div className="space-y-3">
          {account.kind === 'cash_holder' && (
            <Row label="Nama Pemegang" value={account.holderName ?? '-'} />
          )}
          {account.kind === 'bank' && (
            <>
              <Row label="Nama Bank" value={account.bankName ?? '-'} />
              <Row label="Nomor Rekening" value={account.accountNumber ?? '-'} mono />
              <Row label="Atas Nama" value={account.accountHolderName ?? '-'} />
            </>
          )}
          <Row label="Saldo Awal" value={formatRupiah(account.initialBalance)} />
          <div className="border-t pt-3">
            <p className="text-xs text-gray-500 mb-0.5">Saldo Saat Ini</p>
            <p className="text-2xl font-bold text-green-600">
              {formatRupiah(account.currentBalance)}
            </p>
          </div>
          <Row label="Dibuat" value={formatDate(account.createdAt)} />
        </div>
      </div>

      <Link
        href="/accounts"
        className="block text-center text-sm text-gray-500 hover:text-gray-700"
      >
        ← Kembali ke daftar akun
      </Link>
    </div>
  )
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-sm font-medium text-gray-900 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}
