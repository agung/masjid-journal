import { getActiveOrganizationContext } from '@/lib/auth/guards'
import { listMembers } from '@/lib/server/organizations'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  treasurer: 'Bendahara',
  viewer: 'Viewer',
}

export default async function MembersPage() {
  const ctx = await getActiveOrganizationContext()

  if (!ctx.organization || !ctx.activeOrganizationId) {
    redirect('/dashboard')
  }

  const members = await listMembers(ctx.activeOrganizationId)

  return (
    <div className="p-4 max-w-md mx-auto pb-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/settings" className="text-gray-500 hover:text-gray-700 mr-3">←</Link>
          <h1 className="text-xl font-bold">Anggota</h1>
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between px-4 py-3.5 border-b last:border-b-0"
          >
            <div>
              <p className="font-medium text-sm text-gray-900">{m.userName}</p>
              <p className="text-xs text-gray-500">{m.userEmail}</p>
            </div>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
              {ROLE_LABEL[m.role] ?? m.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
