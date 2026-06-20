// Vitest 在 node 环境下没有 react-server 条件，原版 `server-only` 会抛错。
// 这个空 stub 让被测的 server 模块（如 lib/site-url.ts）可以在测试中正常加载。
export {}
