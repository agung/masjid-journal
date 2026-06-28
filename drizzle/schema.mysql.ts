import {
  mysqlTable,
  text,
  varchar,
  boolean,
  timestamp,
  bigint,
  date,
  json,
  uniqueIndex,
  index,
  primaryKey,
} from 'drizzle-orm/mysql-core'

// ============================================================
// BETTER AUTH REQUIRED TABLES
// These must match Better Auth's expected schema.
// https://www.better-auth.com/docs/concepts/database
// ============================================================

export const user = mysqlTable('user', {
  id: varchar('id', { length: 36 }).primaryKey().notNull(),
  name: text('name').notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const session = mysqlTable('session', {
  id: varchar('id', { length: 36 }).primaryKey().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  token: varchar('token', { length: 512 }).notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  activeOrganizationId: varchar('active_organization_id', { length: 36 }),
})

export const account = mysqlTable('account', {
  id: varchar('id', { length: 36 }).primaryKey().notNull(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
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

export const verification = mysqlTable('verification', {
  id: varchar('id', { length: 36 }).primaryKey().notNull(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// ============================================================
// BETTER AUTH ORGANIZATION PLUGIN TABLES
// ============================================================

export const organization = mysqlTable('organization', {
  id: varchar('id', { length: 36 }).primaryKey().notNull(),
  name: text('name').notNull(),
  slug: varchar('slug', { length: 100 }).unique(),
  logo: text('logo'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  metadata: text('metadata'),
})

export const member = mysqlTable('member', {
  id: varchar('id', { length: 36 }).primaryKey().notNull(),
  organizationId: varchar('organization_id', { length: 36 }).notNull().references(() => organization.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).notNull().default('treasurer'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const invitation = mysqlTable('invitation', {
  id: varchar('id', { length: 36 }).primaryKey().notNull(),
  organizationId: varchar('organization_id', { length: 36 }).notNull().references(() => organization.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: varchar('role', { length: 50 }),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  expiresAt: timestamp('expires_at').notNull(),
  inviterId: varchar('inviter_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
})

// ============================================================
// APPLICATION TABLES
// ============================================================

/**
 * accounts — Unified table for cash holders and bank accounts.
 * kind: 'cash_holder' | 'bank'
 */
export const masjidAccount = mysqlTable(
  'masjid_account',
  {
    id: varchar('id', { length: 36 }).primaryKey().notNull(),
    organizationId: varchar('organization_id', { length: 36 })
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    kind: varchar('kind', { length: 20, enum: ['cash_holder', 'bank'] }).notNull(),
    name: text('name').notNull(),

    // For cash_holder
    holderName: text('holder_name'),
    holderUserId: varchar('holder_user_id', { length: 36 }).references(() => user.id, { onDelete: 'set null' }),

    // For bank
    bankName: text('bank_name'),
    accountNumber: text('account_number'),
    accountHolderName: text('account_holder_name'),

    balance: bigint('balance', { mode: 'number' }).notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),

    createdBy: varchar('created_by', { length: 36 }).notNull().references(() => user.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    idxMasjidAccountOrg: index('idx_masjid_account_org').on(t.organizationId),
    idxMasjidAccountKindActive: index('idx_masjid_account_kind_active').on(t.organizationId, t.kind, t.isActive),
  })
)

/**
 * categories — Income and expense categories.
 * organizationId = null means system/global category.
 */
export const category = mysqlTable(
  'category',
  {
    id: varchar('id', { length: 36 }).primaryKey().notNull(),
    organizationId: varchar('organization_id', { length: 36 }).references(() => organization.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 20, enum: ['income', 'expense'] }).notNull(),
    name: text('name').notNull(),
    icon: text('icon'),
    isSystem: boolean('is_system').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    idxCategoryOrgType: index('idx_category_org_type').on(t.organizationId, t.type),
  })
)

/**
 * transactions — The header record for each financial event.
 */
export const transaction = mysqlTable(
  'transaction',
  {
    id: varchar('id', { length: 36 }).primaryKey().notNull(),
    organizationId: varchar('organization_id', { length: 36 })
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    transactionNo: varchar('transaction_no', { length: 50 }).notNull(),
    type: varchar('type', { length: 20, enum: ['income', 'expense', 'transfer', 'deposit', 'withdrawal', 'adjustment'] }).notNull(),
    transactionDate: date('transaction_date').notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    categoryId: varchar('category_id', { length: 36 }).references(() => category.id, { onDelete: 'set null' }),
    description: text('description').notNull(),
    notes: text('notes'),
    proofStoragePath: text('proof_storage_path'),
    proofPublicUrl: text('proof_public_url'),
    createdBy: varchar('created_by', { length: 36 }).notNull().references(() => user.id),
    updatedBy: varchar('updated_by', { length: 36 }).references(() => user.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    uqTransactionNo: uniqueIndex('uq_transaction_no').on(t.organizationId, t.transactionNo),
    idxTransactionOrgDate: index('idx_transaction_org_date').on(t.organizationId, t.transactionDate),
    idxTransactionOrgType: index('idx_transaction_org_type').on(t.organizationId, t.type),
  })
)

/**
 * transaction_movements — Journal lines per transaction.
 * Each movement records the balance snapshot at the time of posting.
 */
export const transactionMovement = mysqlTable(
  'transaction_movement',
  {
    id: varchar('id', { length: 36 }).primaryKey().notNull(),
    organizationId: varchar('organization_id', { length: 36 })
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    transactionId: varchar('transaction_id', { length: 36 })
      .notNull()
      .references(() => transaction.id, { onDelete: 'cascade' }),
    accountId: varchar('account_id', { length: 36 })
      .notNull()
      .references(() => masjidAccount.id),
    direction: varchar('direction', { length: 10, enum: ['in', 'out'] }).notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    // Positive for 'in', negative for 'out'
    signedAmount: bigint('signed_amount', { mode: 'number' }).notNull(),
    balanceBefore: bigint('balance_before', { mode: 'number' }).notNull(),
    balanceAfter: bigint('balance_after', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    idxMovementTransaction: index('idx_movement_transaction').on(t.transactionId),
    idxMovementAccount: index('idx_movement_account').on(t.organizationId, t.accountId, t.createdAt),
  })
)

/**
 * audit_logs — Immutable trail of all create/update/delete actions.
 */
export const auditLog = mysqlTable(
  'audit_log',
  {
    id: varchar('id', { length: 36 }).primaryKey().notNull(),
    organizationId: varchar('organization_id', { length: 36 })
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    actorUserId: varchar('actor_user_id', { length: 36 }).notNull().references(() => user.id),
    action: varchar('action', { length: 20 }).notNull(), // 'create' | 'update' | 'delete'
    entityType: varchar('entity_type', { length: 50 }).notNull(), // 'transaction' | 'account' | 'category'
    entityId: varchar('entity_id', { length: 36 }).notNull(),
    before: json('before'),
    after: json('after'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    idxAuditLogOrg: index('idx_audit_log_org').on(t.organizationId, t.createdAt),
    idxAuditLogEntity: index('idx_audit_log_entity').on(t.entityType, t.entityId),
  })
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
