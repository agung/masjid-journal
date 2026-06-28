import {
  pgTable,
  text,
  boolean,
  timestamp,
  bigint,
  date,
  jsonb,
  uniqueIndex,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core'

// ============================================================
// BETTER AUTH REQUIRED TABLES
// These must match Better Auth's expected schema.
// https://www.better-auth.com/docs/concepts/database
// ============================================================

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  activeOrganizationId: text('active_organization_id'),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// ============================================================
// BETTER AUTH ORGANIZATION PLUGIN TABLES
// ============================================================

export const organization = pgTable('organization', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').unique(),
  logo: text('logo'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  metadata: text('metadata'),
})

export const member = pgTable('member', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('treasurer'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const invitation = pgTable('invitation', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role'),
  status: text('status').notNull().default('pending'),
  expiresAt: timestamp('expires_at').notNull(),
  inviterId: text('inviter_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
})

// ============================================================
// APPLICATION TABLES
// ============================================================

/**
 * accounts — Unified table for cash holders and bank accounts.
 * kind: 'cash_holder' | 'bank'
 */
export const masjidAccount = pgTable(
  'masjid_account',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: ['cash_holder', 'bank'] }).notNull(),
    name: text('name').notNull(),

    // For cash_holder
    holderName: text('holder_name'),
    holderUserId: text('holder_user_id').references(() => user.id, { onDelete: 'set null' }),

    // For bank
    bankName: text('bank_name'),
    accountNumber: text('account_number'),
    accountHolderName: text('account_holder_name'),

    balance: bigint('balance', { mode: 'number' }).notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),

    createdBy: text('created_by').notNull().references(() => user.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_masjid_account_org').on(t.organizationId),
    index('idx_masjid_account_kind_active').on(t.organizationId, t.kind, t.isActive),
  ]
)

/**
 * categories — Income and expense categories.
 * organizationId = null means system/global category.
 */
export const category = pgTable(
  'category',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id').references(() => organization.id, { onDelete: 'cascade' }),
    type: text('type', { enum: ['income', 'expense'] }).notNull(),
    name: text('name').notNull(),
    icon: text('icon'),
    isSystem: boolean('is_system').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_category_org_type').on(t.organizationId, t.type),
  ]
)

/**
 * transactions — The header record for each financial event.
 */
export const transaction = pgTable(
  'transaction',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    transactionNo: text('transaction_no').notNull(),
    type: text('type', {
      enum: ['income', 'expense', 'transfer', 'deposit', 'withdrawal', 'adjustment'],
    }).notNull(),
    transactionDate: date('transaction_date').notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    categoryId: text('category_id').references(() => category.id, { onDelete: 'set null' }),
    description: text('description').notNull(),
    notes: text('notes'),
    proofStoragePath: text('proof_storage_path'),
    proofPublicUrl: text('proof_public_url'),
    createdBy: text('created_by').notNull().references(() => user.id),
    updatedBy: text('updated_by').references(() => user.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('uq_transaction_no').on(t.organizationId, t.transactionNo),
    index('idx_transaction_org_date').on(t.organizationId, t.transactionDate),
    index('idx_transaction_org_type').on(t.organizationId, t.type),
  ]
)

/**
 * transaction_movements — Journal lines per transaction.
 * Each movement records the balance snapshot at the time of posting.
 */
export const transactionMovement = pgTable(
  'transaction_movement',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    transactionId: text('transaction_id')
      .notNull()
      .references(() => transaction.id, { onDelete: 'cascade' }),
    accountId: text('account_id')
      .notNull()
      .references(() => masjidAccount.id),
    direction: text('direction', { enum: ['in', 'out'] }).notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    // Positive for 'in', negative for 'out'
    signedAmount: bigint('signed_amount', { mode: 'number' }).notNull(),
    balanceBefore: bigint('balance_before', { mode: 'number' }).notNull(),
    balanceAfter: bigint('balance_after', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_movement_transaction').on(t.transactionId),
    index('idx_movement_account').on(t.organizationId, t.accountId, t.createdAt),
  ]
)

/**
 * audit_logs — Immutable trail of all create/update/delete actions.
 */
export const auditLog = pgTable(
  'audit_log',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    actorUserId: text('actor_user_id').notNull().references(() => user.id),
    action: text('action').notNull(), // 'create' | 'update' | 'delete'
    entityType: text('entity_type').notNull(), // 'transaction' | 'account' | 'category'
    entityId: text('entity_id').notNull(),
    before: jsonb('before'),
    after: jsonb('after'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_audit_log_org').on(t.organizationId, t.createdAt),
    index('idx_audit_log_entity').on(t.entityType, t.entityId),
  ]
)

// ============================================================
// TYPE EXPORTS
// ============================================================

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
