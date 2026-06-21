import { requireAuth } from '@/lib/auth/guards'
import { listAccounts } from '@/lib/server/accounts'
import { formatRupiah } from '@/lib/formatters'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import type { MasjidAccount } from '@/drizzle/schema'

type AccountWithBalance = MasjidAccount & { currentBalance: number }

export default async function AccountsPage() {
  const session = await requireAuth()
  const activeOrgId = (session.session as unknown as { activeOrganizationId?: string }).activeOrganizationId

  const accounts: AccountWithBalance[] = activeOrgId
    ? (await listAccounts(activeOrgId)) as AccountWithBalance[]
    : []

  const cashHolders = accounts.filter((a) => a.kind === 'cash_holder')
  const bankAccounts = accounts.filter((a) => a.kind === 'bank')

  const totalCash = cashHolders
    .filter((a) => a.isActive)
    .reduce((sum, a) => sum + a.currentBalance, 0)

  const totalBank = bankAccounts
    .filter((a) => a.isActive)
    .reduce((sum, a) => sum + a.currentBalance, 0)

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Akun Keuangan</h1>
        <Link
          href="/accounts/new"
          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={16} />
          Tambah
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-orange-50 rounded-xl p-4">
          <p className="text-xs text-orange-600 font-medium mb-1">💰 Total Kas Tunai</p>
          <p className="text-lg font-bold text-orange-700">{formatRupiah(totalCash)}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-xs text-blue-600 font-medium mb-1">🏦 Total Bank</p>
          <p className="text-lg font-bold text-blue-700">{formatRupiah(totalBank)}</p>
        </div>
      </div>

      {/* Cash Holders */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Pemegang Kas Tunai
        </h2>
        {cashHolders.length === 0 ? (
          <EmptyState message="Belum ada pemegang kas" href="/accounts/new" />
        ) : (
          <div className="space-y-2">
            {cashHolders.map((acc) => (
              <AccountCard key={acc.id} account={acc} />
            ))}
          </div>
        )}
      </section>

      {/* Bank Accounts */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Rekening Bank
        </h2>
        {bankAccounts.length === 0 ? (
          <EmptyState message="Belum ada rekening bank" href="/accounts/new" />
        ) : (
          <div className="space-y-2">
            {bankAccounts.map((acc) => (
              <AccountCard key={acc.id} account={acc} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function AccountCard({ account }: { account: AccountWithBalance }) {
  return (
    <Link
      href={`/accounts/${account.id}`}
      className={`flex items-center justify-between bg-white border rounded-xl px-4 py-3.5 transition-colors hover:border-green-300 ${
        !account.isActive ? 'opacity-50 grayscale' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl">
          {account.kind === 'cash_holder' ? '💰' : '🏦'}
        </div>
        <div>
          <p className="font-medium text-gray-900 text-sm">{account.name}</p>
          <p className="text-xs text-gray-500">
            {account.kind === 'cash_holder'
              ? account.holderName
              : `${account.bankName} • ${account.accountNumber}`}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-gray-900 text-sm">{formatRupiah(account.currentBalance)}</p>
        {!account.isActive && (
          <span className="text-xs text-gray-400">Nonaktif</span>
        )}
      </div>
    </Link>
  )
}

function EmptyState({ message, href }: { message: string; href: string }) {
  return (
    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
      <p className="text-sm text-gray-500 mb-3">{message}</p>
      <Link
        href={href}
        className="text-sm text-green-600 font-medium hover:text-green-700"
      >
        + Tambah Sekarang
      </Link>
    </div>
  )
}
