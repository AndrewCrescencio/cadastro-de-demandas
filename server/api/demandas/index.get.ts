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
 * FR-016: Ordenação por data decrescente (desempate por criadoEm)
 * FR-017: Filtros combinados são "E lógico"
 * FR-018: A descrição completa NÃO vem na listagem (só no detalhe)
 * FR-019: Lista vazia (sem demandas ou sem resultado aos filtros) responde 200 com []
 * RNF-001: Lógica de negócio isolada em server/utils/demandas/consulta
 * RNF-003: Armazenamento via repositório, separado da interface
 * RNF-004: Filtro inválido responde 400 com mensagem clara em português
 */

import { defineEventHandler, getQuery, setResponseStatus } from 'h3'
import { aplicarConsulta } from '../../utils/demandas/consulta'
import { criarDemandaRepositorio } from '../../utils/demandas/demanda-repositorio'
import { db } from '../../utils/db'
import type { DemandaListagem } from '#shared/types/demanda'

export default defineEventHandler(async (event) => {
  // 1. Ler query params (status, setor, prioridade)
  const query = getQuery(event)
  const brutos = {
    status: typeof query.status === 'string' ? query.status : undefined,
    setor: typeof query.setor === 'string' ? query.setor : undefined,
    prioridade: typeof query.prioridade === 'string' ? query.prioridade : undefined,
  }

  // 2. Buscar todas as demandas via repositório (sem filtro no SQL; filtro é na camada pura)
  const repositorio = criarDemandaRepositorio(db)
  const demandas = await repositorio.listar()

  // 3. Aplicar validação, filtragem (E lógico) e ordenação (camada de negócio pura)
  const resultado = aplicarConsulta(demandas, brutos)

  if ('erros' in resultado) {
    // 4. Filtro inválido: 400 com mensagem clara em português, sem derrubar o endpoint
    const mensagem = resultado.erros.map((e) => e.mensagem).join(' ')
    setResponseStatus(event, 400)
    return { error: 'validation_error', message: mensagem }
  }

  // 5. Mapear para o formato de listagem (sem descricao, conforme FR-018)
  const listagem: DemandaListagem[] = resultado.demandas.map((d) => ({
    id: d.id,
    titulo: d.titulo,
    dataSolicitacao: d.dataSolicitacao,
    setor: d.setor,
    status: d.status,
    prioridade: d.prioridade,
  }))

  // 6. Responder 200 com a lista (possivelmente vazia — não é erro, FR-019)
  setResponseStatus(event, 200)
  return listagem
})
