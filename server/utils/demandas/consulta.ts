/**
 * Consulta de demandas: validação, filtragem e ordenação.
 *
 * Lógica de negócio pura, separada da interface HTTP (server/api) e do
 * armazenamento (repositório). Testável isoladamente.
 *
 * FR-016: Ordenação por data de solicitação decrescente; desempate por criadoEm.
 * FR-017: Filtros combinados são "E lógico" (demanda deve atender a TODOS).
 * RNF-001: Lógica de negócio isolada da interface e do armazenamento.
 * RNF-004: Mensagens de erro em português.
 */

import { STATUS_PERMITIDOS, SETORES_PERMITIDOS, PRIORIDADES } from './config'
import type { ErroValidacao } from './validacao'
import type { Demanda, FiltrosDemanda } from '#shared/types/demanda'

/**
 * Filtros brutos vindos da query string (valores ainda não validados).
 */
export interface FiltrosConsultaBrutos {
  status?: string
  setor?: string
  prioridade?: string
}

/**
 * Valida os valores de filtro recebidos via query string contra as listas
 * permitidas em config.ts. Retorna erros (vazio se tudo OK).
 *
 * Um filtro ausente ou vazio não é erro: simplesmente não é aplicado.
 * Um valor fora da lista permitida é erro (RNF-004).
 */
export function validarFiltrosDeConsulta(brutos: FiltrosConsultaBrutos): ErroValidacao[] {
  const erros: ErroValidacao[] = []

  if (brutos.status !== undefined && brutos.status !== '') {
    if (!STATUS_PERMITIDOS.includes(brutos.status as (typeof STATUS_PERMITIDOS)[number])) {
      erros.push({
        campo: 'status',
        mensagem:
          `Filtro 'status' inválido: '${brutos.status}' não é um valor permitido. ` +
          `Valores aceitos: ${STATUS_PERMITIDOS.join(', ')}.`,
      })
    }
  }

  if (brutos.setor !== undefined && brutos.setor !== '') {
    if (!SETORES_PERMITIDOS.includes(brutos.setor as (typeof SETORES_PERMITIDOS)[number])) {
      erros.push({
        campo: 'setor',
        mensagem:
          `Filtro 'setor' inválido: '${brutos.setor}' não é um valor permitido. ` +
          `Valores aceitos: ${SETORES_PERMITIDOS.join(', ')}.`,
      })
    }
  }

  if (brutos.prioridade !== undefined && brutos.prioridade !== '') {
    if (!PRIORIDADES.includes(brutos.prioridade as (typeof PRIORIDADES)[number])) {
      erros.push({
        campo: 'prioridade',
        mensagem:
          `Filtro 'prioridade' inválido: '${brutos.prioridade}' não é um valor permitido. ` +
          `Valores aceitos: ${PRIORIDADES.join(', ')}.`,
      })
    }
  }

  return erros
}

/**
 * Converte filtros brutos (strings da query string) para FiltrosDemanda tipados.
 * Valores ausentes/vazios são omitidos.
 */
export function normalizarFiltros(brutos: FiltrosConsultaBrutos): FiltrosDemanda {
  const filtros: FiltrosDemanda = {}

  if (brutos.status !== undefined && brutos.status !== '') {
    filtros.status = brutos.status as FiltrosDemanda['status']
  }

  if (brutos.setor !== undefined && brutos.setor !== '') {
    filtros.setor = brutos.setor as FiltrosDemanda['setor']
  }

  if (brutos.prioridade !== undefined && brutos.prioridade !== '') {
    filtros.prioridade = brutos.prioridade as FiltrosDemanda['prioridade']
  }

  return filtros
}

/**
 * Filtra demandas aplicando todos os filtros informados com "E lógico" (FR-017).
 * Uma demanda só permanece se atender a TODOS os filtros aplicados.
 */
export function filtrarDemandas(demandas: Demanda[], filtros: FiltrosDemanda): Demanda[] {
  return demandas.filter((demanda) => {
    if (filtros.status !== undefined && demanda.status !== filtros.status) {
      return false
    }
    if (filtros.setor !== undefined && demanda.setor !== filtros.setor) {
      return false
    }
    if (filtros.prioridade !== undefined && demanda.prioridade !== filtros.prioridade) {
      return false
    }
    return true
  })
}

/**
 * Ordena demandas por data de solicitação decrescente (mais recente primeiro).
 * Em caso de empate, a demanda cadastrada por último vem primeiro (criadoEm) — FR-016.
 */
export function ordenarDemandas(demandas: Demanda[]): Demanda[] {
  return [...demandas].sort((a, b) => {
    // dataSolicitacao é ISO (YYYY-MM-DD), comparável como texto
    if (a.dataSolicitacao !== b.dataSolicitacao) {
      return b.dataSolicitacao.localeCompare(a.dataSolicitacao)
    }

    // Desempate: criadoEm decrescente (último cadastrado primeiro)
    const da = new Date(a.criadoEm).getTime()
    const db_ = new Date(b.criadoEm).getTime()
    return db_ - da
  })
}

/**
 * Aplica validação, filtragem e ordenação em sequência.
 * Retorna { erros } se a validação falhar, ou { demandas } já filtradas e ordenadas.
 */
export function aplicarConsulta(
  demandas: Demanda[],
  brutos: FiltrosConsultaBrutos,
): { erros: ErroValidacao[] } | { demandas: Demanda[] } {
  const erros = validarFiltrosDeConsulta(brutos)

  if (erros.length > 0) {
    return { erros }
  }

  const filtros = normalizarFiltros(brutos)
  const filtradas = filtrarDemandas(demandas, filtros)
  const ordenadas = ordenarDemandas(filtradas)

  return { demandas: ordenadas }
}
