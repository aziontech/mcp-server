import path from 'node:path'
import { defineConfig } from 'vitest/config'

const root = path.resolve(__dirname, '../..')

export default defineConfig({
  root,
  resolve: {
    alias: { '@': path.join(root, 'src') },
  },
  test: {
    include: ['tests/vitest/functional/**/*.test.ts'],
    environment: 'node',
    testTimeout: 30_000,
  },
})
