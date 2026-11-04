/**
 * POST /api/demandas
 *
 * Cria uma nova demanda.
 *
 * História 1: Cadastrar uma demanda válida
 * História 2: Impedir cadastro incompleto ou inválido
 * História 3: Prioridade definida automaticamente
 */

export default defineEventHandler(async (_event) => {
  // TODO: Implementar lógica de cadastro
  // 1. Ler body da requisição
  // 2. Validar com validarCriacaoDemanda()
  // 3. Se inválido, retornar 400 com erros formatados
  // 4. Calcular prioridade com calcularPrioridade()
  // 5. Converter data para ISO
  // 6. Inserir no banco
  // 7. Retornar 201 com RespostaCadastro

  return {
    message: 'Endpoint de cadastro ainda não implementado',
    status: 'boilerplate',
  }
})
