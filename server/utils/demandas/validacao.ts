/**
 * Validação de demandas.
 *
 * FR-002 a FR-007: Regras de validação de campos
 * RNF-001: Lógica separada e testável
 * RNF-004: Mensagens em português
 */

import { z } from 'zod'
import { STATUS_PERMITIDOS, SETORES_PERMITIDOS, LIMITES } from './config'

/**
 * Converte data DD/MM/AAAA para objeto Date.
 *
 * @param dataStr - String no formato DD/MM/AAAA
 * @returns Date ou null se inválida
 */
export function parseDataBrasileira(dataStr: string): Date | null {
  // FR-005: Formato DD/MM/AAAA
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/
  const match = dataStr.match(regex)

  if (!match) {
    return null
  }

  const [, dia, mes, ano] = match
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia))

  // Valida se a data é real (ex: 31/02 seria inválida)
  if (
    data.getDate() !== Number(dia) ||
    data.getMonth() !== Number(mes) - 1 ||
    data.getFullYear() !== Number(ano)
  ) {
    return null
  }

  return data
}

/**
 * Formata Date para DD/MM/AAAA.
 */
export function formatarDataBrasileira(data: Date): string {
  const dia = String(data.getDate()).padStart(2, '0')
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const ano = data.getFullYear()
  return `${dia}/${mes}/${ano}`
}

/**
 * Converte data DD/MM/AAAA para ISO 8601 (YYYY-MM-DD).
 *
 * @param dataStr - String no formato DD/MM/AAAA
 * @returns String ISO ou null se inválida
 */
export function converterParaISO(dataStr: string): string | null {
  const data = parseDataBrasileira(dataStr)
  if (!data) {
    return null
  }
  return data.toISOString().split('T')[0]
}

/**
 * Validador customizado Zod para data brasileira não futura.
 */
const dataBrasileiraSchema = z.string().refine(
  (val) => {
    const data = parseDataBrasileira(val)
    if (!data) {
      return false
    }

    // FR-005: Não pode ser futura
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    return data <= hoje
  },
  {
    message: 'Data de solicitação deve estar no formato DD/MM/AAAA e não pode ser futura',
  },
)

/**
 * Schema Zod para validação de criação de demanda.
 *
 * Implementa todas as regras FR-002 a FR-007.
 */
export const criarDemandaSchema = z
  .object({
    titulo: z
      .string({
        required_error: 'Título é obrigatório',
        invalid_type_error: 'Título deve ser um texto',
      })
      .trim()
      .min(1, 'Título é obrigatório')
      .max(
        LIMITES.TITULO_MAX_CHARS,
        `Título não pode exceder ${LIMITES.TITULO_MAX_CHARS} caracteres`,
      ),

    descricao: z
      .string({
        required_error: 'Descrição é obrigatória',
        invalid_type_error: 'Descrição deve ser um texto',
      })
      .trim()
      .min(1, 'Descrição é obrigatória')
      .max(
        LIMITES.DESCRICAO_MAX_CHARS,
        `Descrição não pode exceder ${LIMITES.DESCRICAO_MAX_CHARS} caracteres`,
      ),

    dataSolicitacao: dataBrasileiraSchema,

    setor: z.enum(SETORES_PERMITIDOS as [string, ...string[]], {
      required_error: 'Setor é obrigatório',
      invalid_type_error: 'Setor inválido',
    }),

    status: z.enum(STATUS_PERMITIDOS as [string, ...string[]], {
      required_error: 'Status é obrigatório',
      invalid_type_error: 'Status inválido',
    }),

    // FR-014: Prioridade não deve ser aceita do usuário
    // Se vier no payload, é ignorada
  })
  .strict() // Não permite campos extras

/**
 * Valida dados de criação de demanda.
 *
 * @param dados - Objeto com os dados da demanda
 * @returns Resultado da validação com erros formatados ou dados válidos
 */
export function validarCriacaoDemanda(dados: unknown) {
  return criarDemandaSchema.safeParse(dados)
}

/**
 * Formata erros do Zod para resposta amigável.
 *
 * RNF-004: Mensagens em português indicando qual campo e o que corrigir
 */
export function formatarErrosValidacao(erros: z.ZodError) {
  return erros.errors.map((erro) => ({
    campo: erro.path.join('.') || 'geral',
    mensagem: erro.message,
  }))
}
