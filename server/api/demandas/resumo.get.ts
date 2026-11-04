/**
 * GET /api/demandas/resumo
 *
 * Retorna resumo estatístico das demandas (opcional).
 *
 * História 5: Resumo visual das demandas
 * FR-020, FR-021: Total e agrupamentos
 */

export default defineEventHandler(async (_event) => {
  // TODO: Implementar lógica de resumo (opcional - P3)
  // 1. Buscar todas as demandas
  // 2. Contar total
  // 3. Agrupar por status, setor, prioridade
  // 4. Retornar ResumoDemandas

  return {
    message: 'Endpoint de resumo ainda não implementado (opcional)',
    status: 'boilerplate',
  }
})
