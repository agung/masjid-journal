import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'

const migration = readFileSync(new URL('../drizzle/migrations/0000_initial_d1.sql', import.meta.url), 'utf8')
const database = new DatabaseSync(':memory:')
database.exec('PRAGMA foreign_keys = ON')
database.exec(migration)

test('migration seeds defaults idempotently and stores dates as milliseconds', () => {
  const seed = migration.slice(migration.indexOf('INSERT OR IGNORE INTO category'))
  database.exec(seed)
  const [{ count }] = database.prepare('SELECT COUNT(*) AS count FROM category').all()
  assert.equal(count, 15)
  const epoch = 1793951030153
  database.prepare('INSERT INTO user (id, name, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run('u1', 'Owner', 'owner@example.test', epoch, epoch)
  const user = database.prepare('SELECT email_verified, created_at FROM user WHERE id = ?').get('u1')
  assert.equal(user.email_verified, 0)
  assert.equal(new Date(user.created_at).getTime(), epoch)
})

test('foreign keys and organization membership uniqueness are enforced', () => {
  database.prepare('INSERT INTO organization (id, name, created_at) VALUES (?, ?, ?)').run('o1', 'Masjid', 1)
  const addMember = database.prepare('INSERT INTO member (id, organization_id, user_id, created_at) VALUES (?, ?, ?, ?)')
  addMember.run('m1', 'o1', 'u1', 1)
  assert.throws(() => addMember.run('m2', 'o1', 'u1', 2))
  assert.throws(() => addMember.run('m3', 'missing-org', 'u1', 3))
})

test('rupiah values remain integers and transaction numbers are unique per organization', () => {
  database.prepare('INSERT INTO masjid_account (id, organization_id, kind, name, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run('a1', 'o1', 'cash_holder', 'Kas', 'u1', 1, 1)
  const account = database.prepare('SELECT balance, typeof(balance) AS storage_type FROM masjid_account WHERE id = ?').get('a1')
  assert.equal(account.balance, 0)
  assert.equal(account.storage_type, 'integer')
  const insertTx = database.prepare('INSERT INTO "transaction" (id, organization_id, transaction_no, type, transaction_date, amount, description, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  insertTx.run('t1', 'o1', 'EXP-202611-0001', 'expense', '2026-11-06', 12500, 'Listrik', 'u1', 1, 1)
  assert.throws(() => insertTx.run('t2', 'o1', 'EXP-202611-0001', 'expense', '2026-11-06', 500, 'Air', 'u1', 1, 1))
  database.prepare('INSERT INTO organization (id, name, created_at) VALUES (?, ?, ?)').run('o2', 'Masjid Lain', 1)
  insertTx.run('t3', 'o2', 'EXP-202611-0001', 'expense', '2026-11-06', 500, 'Air', 'u1', 1, 1)
})

test.after(() => database.close())
