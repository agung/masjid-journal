/**
 * Role hierarchy and permission definitions.
 * All roles for an organization member.
 */
export const ROLES = ['owner', 'admin', 'treasurer', 'viewer'] as const
export type Role = (typeof ROLES)[number]

export const TRANSACTION_CHANGE_WINDOW_MS = 60 * 60 * 1000

// Role hierarchy: higher index = more permissions
const ROLE_LEVEL: Record<Role, number> = {
  viewer: 0,
  treasurer: 1,
  admin: 2,
  owner: 3,
}

/**
 * Check if a role has at least the minimum required level.
 * e.g. hasMinRole('admin', 'treasurer') => true
 */
export function hasMinRole(userRole: Role, minRole: Role): boolean {
  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[minRole]
}

/**
 * Owners may correct historical transactions. Other roles can only change a
 * transaction during the one-hour window after it was created.
 */
export function isTransactionChangeWindowOpen(
  role: Role,
  createdAt: Date,
  now = Date.now()
): boolean {
  return role === 'owner' || now - createdAt.getTime() <= TRANSACTION_CHANGE_WINDOW_MS
}

/**
 * Permission gates by feature
 */
export const PERMISSIONS = {
  // Transactions
  createTransaction: (role: Role) => hasMinRole(role, 'treasurer'),
  editTransaction: (role: Role) => hasMinRole(role, 'treasurer'),
  deleteTransaction: (role: Role) => hasMinRole(role, 'admin'),

  // Accounts (holders + banks)
  createAccount: (role: Role) => hasMinRole(role, 'admin'),
  editAccount: (role: Role) => hasMinRole(role, 'admin'),
  deactivateAccount: (role: Role) => hasMinRole(role, 'admin'),

  // Categories
  manageCategories: (role: Role) => hasMinRole(role, 'admin'),

  // Organization
  manageMembers: (role: Role) => hasMinRole(role, 'owner'),
  manageOrganization: (role: Role) => hasMinRole(role, 'owner'),

  // Reports
  viewReports: (role: Role) => hasMinRole(role, 'viewer'),
} as const

export type Permission = keyof typeof PERMISSIONS
