/**
 * GET /api/demandas
 *
 * Lista todas as demandas com suporte a filtros.
 *
 * Query params opcionais:
 * - status: Status
 * - setor: Setor
 * - prioridade: Prioridade
 *
 * História 4: Consultar demandas
 * FR-016: Ordenação por data decrescente
 * FR-017: Filtros combinados
 */

export default defineEventHandler(async (_event) => {
  // TODO: Implementar lógica de listagem
  // 1. Ler query params (status, setor, prioridade)
  // 2. Construir query do Drizzle com filtros
  // 3. Ordenar por dataSolicitacao DESC, criadoEm DESC
  // 4. Executar query
  // 5. Retornar array de demandas

  return {
    message: 'Endpoint de listagem ainda não implementado',
    status: 'boilerplate',
  }
})
