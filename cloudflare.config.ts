import { bindings, defineConfig, defineWorker, exports } from 'cf/config'
import { createWorkersResponseStoreSelfContainedConfig } from '@vinext/cloudflare/cache/config'

const responseStore = await createWorkersResponseStoreSelfContainedConfig({ worker: 'masjid-journal', bucket: 'masjid-journal-response-cache' })

export default defineConfig({
  worker: defineWorker({
    name: 'masjid-journal',
    entrypoint: 'worker.ts',
    compatibilityDate: '2026-11-06',
    compatibilityFlags: ['nodejs_compat'],
    assets: {
      htmlHandling: 'none',
      notFoundHandling: 'none',
      runWorkerFirst: ['/*', '!/_next/static/*', '!/*/_next/static/*'],
    },
    ...responseStore,
    env: {
      ...responseStore.env,
      ASSETS: bindings.assets(),
      DB: bindings.d1({ name: 'masjid-journal', id: 'ea4c96b6-0d5f-4036-88c3-bd93adfb81a5' }),
      PROOF_BUCKET: bindings.r2({ name: 'masjid-journal-proofs' }),
      LEDGER_COORDINATOR: bindings.durableObject({ worker: 'masjid-journal', exportName: 'LedgerCoordinator' }),
    },
    exports: {
      ...responseStore.exports,
      LedgerCoordinator: exports.durableObject({ storage: 'sqlite' }),
    },
  }),
})
