/**
 * GET /api/demandas/:id
 *
 * Obtém uma demanda específica por ID.
 *
 * História 4: Ver todos os campos incluindo descrição completa
 * FR-018: Detalhe de demanda individual devolve TODOS os campos (incluindo descrição completa)
 * RNF-001: Lógica de acesso a dados isolada no repositório (demanda-repositorio)
 * RNF-003: Armazenamento via repositório, separado da interface HTTP
 * RNF-004: ID inexistente ou em formato inválido responde 404 com mensagem clara em português
 * RNF-006: Texto devolvido puro, exatamente como foi salvo (sem reinterpretar marcação/HTML)
 */

import { defineEventHandler, getRouterParam, setResponseStatus } from 'h3'
import { criarDemandaRepositorio } from '../../utils/demandas/demanda-repositorio'
import { db } from '../../utils/db'

/**
 * O identificador usado no projeto é numérico (serial do banco).
 * Retorna null quando o valor da rota não é um id válido.
 */
function extrairIdValido(idBruto: unknown): number | null {
  if (typeof idBruto !== 'string' || idBruto === '') {
    return null
  }

  const id = Number(idBruto)

  if (!Number.isFinite(id) || !Number.isInteger(id) || id <= 0) {
    return null
  }

  // Rejeita formas não canônicas (ex.: '05', '5 ', '+5', '5.0')
  if (String(id) !== idBruto) {
    return null
  }

  return id
}

export default defineEventHandler(async (event) => {
  // 1. Obter o ID da rota e validar o formato.
  //    Formato inválido = "não encontrado" (404), nunca exceção não tratada nem 500.
  const id = extrairIdValido(getRouterParam(event, 'id'))

  if (id === null) {
    const bruto = getRouterParam(event, 'id')
    setResponseStatus(event, 404)
    return {
      error: 'not_found',
      message: `Demanda com id "${bruto}" não encontrada.`,
    }
  }

  // 2. Buscar via repositório (mesma camada de acesso a dados dos demais endpoints).
  const repositorio = criarDemandaRepositorio(db)
  const demanda = await repositorio.buscarPorId(id)

  // 3. Não encontrado: 404 com mensagem clara em português (RNF-004).
  if (!demanda) {
    setResponseStatus(event, 404)
    return {
      error: 'not_found',
      message: `Demanda com id ${id} não encontrada.`,
    }
  }

  // 4. Devolver TODOS os campos, incluindo a descrição completa (FR-018),
  //    exatamente como foi salvo, sem reinterpretar conteúdo (RNF-006).
  setResponseStatus(event, 200)
  return demanda
})
