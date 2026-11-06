import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
  index,
} from 'drizzle-orm/sqlite-core'

// SQLite/D1 schema. Legacy Better Auth tables remain in place during cutover;
// the app uses Clerk identities mapped to stable D1 user IDs.
const timestamp = (name: string) => integer(name, { mode: 'timestamp_ms' })
const bool = (name: string) => integer(name, { mode: 'boolean' })
const money = (name: string) => integer(name, { mode: 'number' })

export const user = sqliteTable('user', {
  id: text('id').primaryKey(), name: text('name').notNull(), email: text('email').notNull().unique(),
  clerkId: text('clerk_id').unique(), activeOrganizationId: text('active_organization_id'),
  emailVerified: bool('email_verified').notNull().default(false), image: text('image'),
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').notNull().$defaultFn(() => new Date()),
})

export const session = sqliteTable('session', {
  id: text('id').primaryKey(), expiresAt: timestamp('expires_at').notNull(), token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').notNull().$defaultFn(() => new Date()),
  ipAddress: text('ip_address'), userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  activeOrganizationId: text('active_organization_id'),
})

export const account = sqliteTable('account', {
  id: text('id').primaryKey(), accountId: text('account_id').notNull(), providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'), refreshToken: text('refresh_token'), idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'), refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'), password: text('password'),
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').notNull().$defaultFn(() => new Date()),
})

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(), identifier: text('identifier').notNull(), value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(), createdAt: timestamp('created_at').$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()),
})

export const organization = sqliteTable('organization', {
  id: text('id').primaryKey(), name: text('name').notNull(), slug: text('slug').unique(), logo: text('logo'),
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()), metadata: text('metadata'),
})

export const member = sqliteTable('member', {
  id: text('id').primaryKey(), organizationId: text('organization_id').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('treasurer'), createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
}, (t) => [uniqueIndex('uq_member_org_user').on(t.organizationId, t.userId)])

export const invitation = sqliteTable('invitation', {
  id: text('id').primaryKey(), organizationId: text('organization_id').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  email: text('email').notNull(), role: text('role'), status: text('status').notNull().default('pending'),
  expiresAt: timestamp('expires_at').notNull(), inviterId: text('inviter_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
})

export const masjidAccount = sqliteTable('masjid_account', {
  id: text('id').primaryKey(), organizationId: text('organization_id').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  kind: text('kind', { enum: ['cash_holder', 'bank'] }).notNull(), name: text('name').notNull(), holderName: text('holder_name'),
  holderUserId: text('holder_user_id').references(() => user.id, { onDelete: 'set null' }), bankName: text('bank_name'),
  accountNumber: text('account_number'), accountHolderName: text('account_holder_name'), balance: money('balance').notNull().default(0),
  isActive: bool('is_active').notNull().default(true), createdBy: text('created_by').notNull().references(() => user.id),
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()), updatedAt: timestamp('updated_at').notNull().$defaultFn(() => new Date()),
}, (t) => [index('idx_masjid_account_org').on(t.organizationId), index('idx_masjid_account_kind_active').on(t.organizationId, t.kind, t.isActive)])

export const category = sqliteTable('category', {
  id: text('id').primaryKey(), organizationId: text('organization_id').references(() => organization.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['income', 'expense'] }).notNull(), name: text('name').notNull(), icon: text('icon'),
  isSystem: bool('is_system').notNull().default(false), isActive: bool('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
}, (t) => [index('idx_category_org_type').on(t.organizationId, t.type)])

export const transaction = sqliteTable('transaction', {
  id: text('id').primaryKey(), organizationId: text('organization_id').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  transactionNo: text('transaction_no').notNull(), type: text('type', { enum: ['income', 'expense', 'transfer', 'deposit', 'withdrawal', 'adjustment'] }).notNull(),
  transactionDate: text('transaction_date').notNull(), amount: money('amount').notNull(), categoryId: text('category_id').references(() => category.id, { onDelete: 'set null' }),
  description: text('description').notNull(), notes: text('notes'), proofStoragePath: text('proof_storage_path'), proofPublicUrl: text('proof_public_url'),
  createdBy: text('created_by').notNull().references(() => user.id), updatedBy: text('updated_by').references(() => user.id),
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()), updatedAt: timestamp('updated_at').notNull().$defaultFn(() => new Date()),
}, (t) => [uniqueIndex('uq_transaction_no').on(t.organizationId, t.transactionNo), index('idx_transaction_org_date').on(t.organizationId, t.transactionDate), index('idx_transaction_org_type').on(t.organizationId, t.type)])

export const transactionMovement = sqliteTable('transaction_movement', {
  id: text('id').primaryKey(), organizationId: text('organization_id').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  transactionId: text('transaction_id').notNull().references(() => transaction.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull().references(() => masjidAccount.id), direction: text('direction', { enum: ['in', 'out'] }).notNull(),
  amount: money('amount').notNull(), signedAmount: money('signed_amount').notNull(), balanceBefore: money('balance_before').notNull(), balanceAfter: money('balance_after').notNull(),
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
}, (t) => [index('idx_movement_transaction').on(t.transactionId), index('idx_movement_account').on(t.organizationId, t.accountId, t.createdAt)])

export const auditLog = sqliteTable('audit_log', {
  id: text('id').primaryKey(), organizationId: text('organization_id').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  actorUserId: text('actor_user_id').notNull().references(() => user.id), action: text('action').notNull(), entityType: text('entity_type').notNull(), entityId: text('entity_id').notNull(),
  before: text('before', { mode: 'json' }).$type<Record<string, unknown> | null>(), after: text('after', { mode: 'json' }).$type<Record<string, unknown> | null>(),
  createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
}, (t) => [index('idx_audit_log_org').on(t.organizationId, t.createdAt), index('idx_audit_log_entity').on(t.entityType, t.entityId)])

export type User = typeof user.$inferSelect
export type NewUser = typeof user.$inferInsert
export type Organization = typeof organization.$inferSelect
export type Member = typeof member.$inferSelect
export type MasjidAccount = typeof masjidAccount.$inferSelect
export type NewMasjidAccount = typeof masjidAccount.$inferInsert
export type Category = typeof category.$inferSelect
export type NewCategory = typeof category.$inferInsert
export type Transaction = typeof transaction.$inferSelect
export type NewTransaction = typeof transaction.$inferInsert
export type TransactionMovement = typeof transactionMovement.$inferSelect
export type NewTransactionMovement = typeof transactionMovement.$inferInsert
export type AuditLog = typeof auditLog.$inferSelect
