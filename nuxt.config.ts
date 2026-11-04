// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint'],
  devtools: { enabled: true },

  compatibilityDate: '2026-10-10',

  nitro: {
    errorHandler: '~~/server/error-handler',
    imports: {
      dirs: ['server/utils/shared', 'server/utils/db'],
    },
    experimental: {
      tasks: true,
      openAPI: true,
    },
    openAPI: {
      meta: {
        title: 'Cadastro de Demandas API',
        description: 'API do sistema de cadastro de demandas',
        version: '1.0.0',
      },
    },
  },

  eslint: {
    config: {
      typescript: true,
      stylistic: true,
    },
  },
})
