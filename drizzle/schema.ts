// ============================================================
// BARREL FILE: Re-exports schema based on the active dialect
// This file re-exports from schema.pg.ts by default for backward compatibility.
// The actual schema selection happens dynamically in lib/db/index.ts
// ============================================================

export * from './schema.pg'
