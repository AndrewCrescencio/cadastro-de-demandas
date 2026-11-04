/**
 * Tipos compartilhados para o sistema de demandas.
 * Utilizados tanto no frontend quanto no backend.
 */

import type { Status, Setor, Prioridade } from '../../server/utils/demandas/config'

/**
 * Estrutura completa de uma demanda persistida.
 */
export interface Demanda {
  id: number
  titulo: string
  descricao: string
  dataSolicitacao: string // ISO 8601 (YYYY-MM-DD)
  setor: Setor
  status: Status
  prioridade: Prioridade
  criadoEm: Date
}

/**
 * Dados necessários para criar uma nova demanda.
 * Prioridade e identificadores são gerados automaticamente.
 */
export interface CriarDemandaInput {
  titulo: string
  descricao: string
  dataSolicitacao: string // DD/MM/AAAA na entrada do usuário
  setor: Setor
  status: Status
}

/**
 * Filtros disponíveis para consulta de demandas.
 */
export interface FiltrosDemanda {
  status?: Status
  setor?: Setor
  prioridade?: Prioridade
}

/**
 * Resumo estatístico das demandas (opcional - FR-020).
 */
export interface ResumoDemandas {
  total: number
  porStatus: Record<Status, number>
  porSetor: Record<Setor, number>
  porPrioridade: Record<Prioridade, number>
}

/**
 * Resposta de erro padronizada.
 */
export interface ErroValidacao {
  campo: string
  mensagem: string
}

export interface RespostaErro {
  erro: string
  detalhes?: ErroValidacao[]
}

/**
 * Resposta de sucesso no cadastro.
 */
export interface RespostaCadastro {
  sucesso: true
  demanda: {
    id: number
    prioridade: Prioridade
  }
  mensagem: string
}
