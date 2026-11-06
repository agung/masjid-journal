'use server'

import { env } from 'cloudflare:workers'

export async function getProofSignedUrl(storagePath: string | null): Promise<string | null> {
  return storagePath ? `/api/proofs/${encodeURIComponent(storagePath)}` : null
}

export async function deleteProofObject(key: string): Promise<void> {
  await env.PROOF_BUCKET.delete(key)
}
