import { defineConfig } from 'vitest/config'

// Pure-logic modules and their tests live side-by-side under lib/ and use
// relative imports by default. Some shared helpers import through the app's
// `@/*` alias, so keep Vitest aligned with tsconfig path resolution.
export default defineConfig({
  resolve: {
    alias: {
      '@': __dirname,
    },
  },
  test: {
    include: ['**/*.test.ts'],
    environment: 'node',
  },
})
