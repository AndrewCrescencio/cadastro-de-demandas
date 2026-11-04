/**
 * Configuração centralizada do sistema de demandas.
 *
 * Este arquivo centraliza todas as listas e regras configuráveis,
 * permitindo personalização sem alterar a lógica de negócio.
 *
 * FR-006: Setores e Status em listas fechadas configuráveis
 * FR-015: Palavras-chave de prioridade configuráveis
 * SC-007: Mudança em um único ponto
 */

export const STATUS_PERMITIDOS = ['Aberta', 'Em andamento', 'Concluída', 'Cancelada'] as const
export const SETORES_PERMITIDOS = [
  'Administrativo',
  'Comercial',
  'Financeiro',
  'Jurídico',
  'Operações',
  'RH',
  'TI',
  'Outros',
] as const
export const PRIORIDADES = ['Normal', 'Alta'] as const
export const LIMITES = {
  TITULO_MAX_CHARS: 150,
  DESCRICAO_MAX_CHARS: 2000,
} as const

// Tipos derivados das configurações
export type Status = (typeof STATUS_PERMITIDOS)[number]
export type Setor = (typeof SETORES_PERMITIDOS)[number]
export type Prioridade = (typeof PRIORIDADES)[number]
