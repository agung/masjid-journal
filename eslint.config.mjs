import nextPlugin from '@next/eslint-plugin-next'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default [
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: { '@next/next': nextPlugin, 'react-hooks': reactHooks },
    rules: { ...nextPlugin.configs.recommended.rules },
  },
  { ignores: ['.next/**', '.cloudflare/**', 'dist/**', 'node_modules/**', 'worker-configuration.d.ts', 'public/sw.js', 'public/sw.mjs'] },
]
