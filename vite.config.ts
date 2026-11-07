import { defineConfig } from 'vite'
import vinext from 'vinext'
import { cloudflare } from '@cloudflare/vite-plugin'
import { VitePWA } from 'vite-plugin-pwa'
import { responseStoreAdapter } from '@vinext/cloudflare/cache/response-store-adapter'

export default defineConfig({
  plugins: [
    vinext({ cache: responseStoreAdapter({ mode: 'self-contained' }) }),
    cloudflare({
      persistState: { path: '.wrangler/state' },
      viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
    }),
    VitePWA({
      strategies: 'injectManifest',
      outDir: 'public',
      srcDir: 'app',
      filename: 'sw.ts',
      injectRegister: 'auto',
      registerType: 'autoUpdate',
      devOptions: { enabled: false },
      injectManifest: { globDirectory: 'public', globPatterns: ['**/*.{svg,png,ico,woff2,webmanifest}'] },
    }),
  ],
})
