import { defineConfig } from 'vitest/config'

// Pure-logic modules and their tests live side-by-side under lib/ and use
// relative imports by default. Some shared helpers import through the app's
// `@/*` alias, so keep Vitest aligned with tsconfig path resolution.
export default defineConfig({
  resolve: {
    alias: {
      '@': __dirname,
      // node 测试环境缺少 react-server 条件，stub 掉 server-only 以便加载 server 模块。
      'server-only': `${__dirname}/test/stubs/server-only.ts`,
    },
  },
  test: {
    include: ['**/*.test.ts'],
    environment: 'node',
  },
})
