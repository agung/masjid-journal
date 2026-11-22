import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
require('tsx/cjs')

const {
  TRANSACTION_CHANGE_WINDOW_MS,
  isTransactionChangeWindowOpen,
} = require('../lib/auth/roles.ts')

const createdAt = new Date('2026-11-18T16:38:00.000Z')

test('owner can change a transaction after the one-hour window', () => {
  const afterWindow = createdAt.getTime() + TRANSACTION_CHANGE_WINDOW_MS + 1
  assert.equal(isTransactionChangeWindowOpen('owner', createdAt, afterWindow), true)
})

test('non-owner roles remain locked after the one-hour window', () => {
  const afterWindow = createdAt.getTime() + TRANSACTION_CHANGE_WINDOW_MS + 1

  assert.equal(isTransactionChangeWindowOpen('admin', createdAt, afterWindow), false)
  assert.equal(isTransactionChangeWindowOpen('treasurer', createdAt, afterWindow), false)
  assert.equal(isTransactionChangeWindowOpen('viewer', createdAt, afterWindow), false)
})

test('eligible non-owner roles can still change a transaction within one hour', () => {
  const withinWindow = createdAt.getTime() + TRANSACTION_CHANGE_WINDOW_MS - 1

  assert.equal(isTransactionChangeWindowOpen('admin', createdAt, withinWindow), true)
  assert.equal(isTransactionChangeWindowOpen('treasurer', createdAt, withinWindow), true)
})
