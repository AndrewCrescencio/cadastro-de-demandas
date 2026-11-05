/**
 * POST /api/demandas
 *
 * Cria uma nova demanda.
 *
 * FR-001: Cadastro de demanda válida
 * FR-002 a FR-007: Regras de validação de campos (delegado a prepararDemanda)
 * FR-003: Todos os campos inválidos são devolvidos de uma vez, sem gravar nada
 * FR-008: Identificador único e data/hora do cadastro (gerados pelo repositório/banco)
 * FR-010 a FR-014: Prioridade calculada automaticamente; nunca aceita do cliente
 * RNF-001: Lógica de negócio isolada (validacao/prioridade) — a rota apenas as chama
 * RNF-003: Armazenamento via repositório, separado da interface
 */

import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { prepararDemanda } from '../../utils/demandas/validacao'
import { criarDemandaRepositorio } from '../../utils/demandas/demanda-repositorio'
import { db } from '../../utils/db'

export default defineEventHandler(async (event) => {
  // 1. Ler body da requisição
  const body = await readBody(event)

  // 2. Validar e calcular a prioridade.
  //    Qualquer `prioridade` enviada pelo cliente é ignorada por prepararDemanda.
  const resultado = prepararDemanda(body)

  // 3. Inválido: devolver TODOS os erros de uma vez (FR-003) com 422,
  //    sem gravar nenhum registro parcial.
  if (!resultado.sucesso) {
    setResponseStatus(event, 422)
    return resultado.erros
  }

  // 4. Válido: persistir via repositório. id e criadoEm são gerados pelo banco (FR-008).
  const repositorio = criarDemandaRepositorio(db)
  const demanda = await repositorio.inserir(resultado.dados)

  // 5. Responder 201 com o registro criado completo (id, prioridade calculada, criadoEm).
  setResponseStatus(event, 201)
  return demanda
})
