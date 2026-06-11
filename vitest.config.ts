import { defineConfig } from 'vitest/config'

// Pure-logic modules and their tests live side-by-side under lib/ and use
// relative imports, so no path-alias resolution is needed here.
export default defineConfig({
  test: {
    include: ['**/*.test.ts'],
    environment: 'node',
  },
})
