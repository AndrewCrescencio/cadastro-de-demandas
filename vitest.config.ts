import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('.', import.meta.url)),
      '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  test: [
    {
      name: 'unit',
      environment: 'happy-dom',
      include: ['tests/unit/**/*.test.ts'],
    },
    {
      name: 'integration',
      environment: 'node',
      include: ['tests/integration/**/*.test.ts'],
    },
  ],
})
