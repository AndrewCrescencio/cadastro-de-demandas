import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('.', import.meta.url)),
      '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  test: {
    name: 'api-integration',
    environment: 'node',
    include: ['test/api/*.{test,spec}.ts'],
    // Carrega .env.test (DATABASE_URL apontando para banco de testes)
    mode: 'test',
    env: {
      NODE_ENV: 'test',
    },
    // Setup global executado antes de cada arquivo de teste
    setupFiles: ['./test/setup/db-cleanup.ts'],
  },
})
