import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { createAccessControl } from 'better-auth/plugins/access'
import { organization } from 'better-auth/plugins'
import { db } from '@/lib/db'

/**
 * Define statements (resources + actions) for the access control system.
 * These are used to define permissions for each role.
 */
const ac = createAccessControl({
  transaction: ['create', 'edit', 'delete', 'view'],
  account: ['create', 'edit', 'deactivate', 'view'],
  category: ['create', 'edit', 'delete', 'view'],
  report: ['view', 'export'],
  member: ['invite', 'remove', 'update-role', 'view'],
  organization: ['update', 'delete', 'view'],
} as const)

// viewer: read-only access
const viewerRole = ac.newRole({
  transaction: ['view'],
  account: ['view'],
  category: ['view'],
  report: ['view'],
  member: ['view'],
  organization: ['view'],
})

// treasurer: can create & edit transactions
const treasurerRole = ac.newRole({
  transaction: ['create', 'edit', 'view'],
  account: ['view'],
  category: ['view'],
  report: ['view'],
  member: ['view'],
  organization: ['view'],
})

// admin: full control except org management
const adminRole = ac.newRole({
  transaction: ['create', 'edit', 'delete', 'view'],
  account: ['create', 'edit', 'deactivate', 'view'],
  category: ['create', 'edit', 'delete', 'view'],
  report: ['view', 'export'],
  member: ['invite', 'view'],
  organization: ['view'],
})

// owner: full access
const ownerRole = ac.newRole({
  transaction: ['create', 'edit', 'delete', 'view'],
  account: ['create', 'edit', 'deactivate', 'view'],
  category: ['create', 'edit', 'delete', 'view'],
  report: ['view', 'export'],
  member: ['invite', 'remove', 'update-role', 'view'],
  organization: ['update', 'delete', 'view'],
})

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh every day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },

  plugins: [
    organization({
      ac,
      roles: {
        viewer: viewerRole,
        treasurer: treasurerRole,
        admin: adminRole,
        owner: ownerRole,
      },
      creatorRole: 'owner',
    }),
  ],

  // In development, accept any origin so the app works when opened from
  // a phone on the same Wi-Fi (e.g. http://192.168.x.x:3000).
  // In production, lock to NEXT_PUBLIC_APP_URL only.
  trustedOrigins:
    process.env.NODE_ENV === 'development'
      ? async (request?: Request) => {
          const origin = request?.headers.get('origin') ?? ''
          return [
            'http://localhost:3000',
            ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : []),
            origin, // accept whatever origin sent the request
          ].filter(Boolean)
        }
      : [
          process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
        ],
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
