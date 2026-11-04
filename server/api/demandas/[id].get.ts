/**
 * GET /api/demandas/:id
 *
 * Obtém uma demanda específica por ID.
 *
 * História 4: Ver todos os campos incluindo descrição completa
 * FR-018: Detalhe de demanda individual
 */

export default defineEventHandler(async (_event) => {
  // TODO: Implementar lógica de detalhes
  // 1. Obter ID dos params
  // 2. Validar que é número
  // 3. Buscar no banco
  // 4. Se não encontrar, retornar 404
  // 5. Retornar demanda completa

  return {
    message: 'Endpoint de detalhes ainda não implementado',
    status: 'boilerplate',
  }
})
