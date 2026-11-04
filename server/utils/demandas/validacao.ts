/**
 * Validação de demandas.
 *
 * FR-002 a FR-007: Regras de validação de campos
 * RNF-001: Lógica separada e testável
 * RNF-004: Mensagens em português
 */

import { z } from 'zod'
import { STATUS_PERMITIDOS, SETORES_PERMITIDOS, LIMITES } from './config'
import type { Prioridade } from './config'
import { calcularPrioridade } from './prioridade'

export interface ErroValidacao {
  campo: string
  mensagem: string
}

/**
 * Converte data DD/MM/AAAA para objeto Date.
 */
export function parseDataBrasileira(dataStr: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dataStr)
  if (!match) return null

  const dia = Number(match[1])
  const mes = Number(match[2])
  const ano = Number(match[3])
  const data = new Date(ano, mes - 1, dia)

  // Valida se a data é real (ex: 31/02 seria inválida)
  const dataValida =
    data.getDate() === dia && data.getMonth() === mes - 1 && data.getFullYear() === ano

  return dataValida ? data : null
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
 */
export function converterParaISO(dataStr: string): string | null {
  const data = parseDataBrasileira(dataStr)
  if (!data) return null

  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

/**
 * Fuso usado para decidir o que é "hoje" (FR-005).
 * Fixo de propósito: o servidor pode rodar em UTC, e à noite no Brasil
 * ele já estaria no dia seguinte, aceitando datas futuras.
 */
export const FUSO_HORARIO = 'America/Sao_Paulo'

/**
 * Data de "hoje" no fuso da organização, em ISO 8601 (YYYY-MM-DD).
 * Recebe `agora` para poder ser testada sem depender do relógio.
 */
export function hojeISO(agora: Date = new Date()): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO_HORARIO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(agora)

  const valor = (tipo: Intl.DateTimeFormatPartTypes): string =>
    partes.find((p) => p.type === tipo)?.value ?? ''

  return `${valor('year')}-${valor('month')}-${valor('day')}`
}

const estaAusente = (valor: unknown): boolean => valor === undefined || valor === null

/**
 * Mensagem para campos de texto:
 * ausente (undefined/null) = obrigatório; outro tipo = inválido.
 */
const erroTexto =
  (obrigatorio: string, invalido: string) =>
  (iss: { input?: unknown }): string =>
    estaAusente(iss.input) ? obrigatorio : invalido

/**
 * Mensagem para campos de lista fechada:
 * ausente ou vazio = obrigatório; qualquer outro valor fora da lista = inválido.
 */
const erroListaFechada =
  (rotulo: string) =>
  (iss: { input?: unknown }): string =>
    estaAusente(iss.input) || iss.input === '' ? `${rotulo} é obrigatório` : `${rotulo} inválido`

/**
 * Data de solicitação: obrigatória, formato DD/MM/AAAA, data real e não futura.
 */
const dataBrasileiraSchema = z
  .string({
    error: erroTexto(
      'Data de solicitação é obrigatória',
      'Data de solicitação deve ser um texto no formato DD/MM/AAAA',
    ),
  })
  .trim()
  .min(1, 'Data de solicitação é obrigatória')
  .refine(
    (val) => parseDataBrasileira(val) !== null,
    'Data de solicitação deve estar no formato DD/MM/AAAA e ser uma data válida',
  )
  .refine((val) => {
    const iso = converterParaISO(val)
    if (!iso) return true // formato inválido já foi reportado acima

    // Datas ISO (YYYY-MM-DD) comparam corretamente como texto,
    // sem depender do fuso horário do servidor.
    return iso <= hojeISO()
  }, 'Data de solicitação não pode ser futura')

/**
 * Schema Zod para validação de criação de demanda.
 * A prioridade não faz parte da entrada: é calculada em prepararDemanda.
 */
export const criarDemandaSchema = z.object({
  titulo: z
    .string({ error: erroTexto('Título é obrigatório', 'Título deve ser um texto') })
    .trim()
    .min(1, 'Título é obrigatório')
    .max(
      LIMITES.TITULO_MAX_CHARS,
      `Título não pode exceder ${LIMITES.TITULO_MAX_CHARS} caracteres`,
    ),

  descricao: z
    .string({ error: erroTexto('Descrição é obrigatória', 'Descrição deve ser um texto') })
    .trim()
    .min(1, 'Descrição é obrigatória')
    .max(
      LIMITES.DESCRICAO_MAX_CHARS,
      `Descrição não pode exceder ${LIMITES.DESCRICAO_MAX_CHARS} caracteres`,
    ),

  dataSolicitacao: dataBrasileiraSchema,

  setor: z.enum(SETORES_PERMITIDOS, { error: erroListaFechada('Setor') }),

  status: z.enum(STATUS_PERMITIDOS, { error: erroListaFechada('Status') }),
})

export type CriarDemandaInput = z.infer<typeof criarDemandaSchema>

export type DemandaNova = CriarDemandaInput & { prioridade: Prioridade }

export type ResultadoCadastro =
  { sucesso: true; dados: DemandaNova } | { sucesso: false; erros: ErroValidacao[] }

/**
 * Valida dados de criação de demanda.
 */
export function validarCriacaoDemanda(dados: unknown) {
  return criarDemandaSchema.safeParse(dados)
}

/**
 * Formata erros do Zod para resposta amigável (um erro por campo).
 */
export function formatarErrosValidacao(erros: z.ZodError): ErroValidacao[] {
  const porCampo = new Map<string, string>()

  for (const erro of erros.issues) {
    const campo = erro.path.map(String).join('.') || 'geral'
    if (!porCampo.has(campo)) porCampo.set(campo, erro.message)
  }

  return Array.from(porCampo, ([campo, mensagem]) => ({ campo, mensagem }))
}

/**
 * Valida a entrada e define a prioridade automaticamente pela descrição.
 * Qualquer `prioridade` enviada pelo cliente é ignorada.
 */
export function prepararDemanda(dados: unknown): ResultadoCadastro {
  const resultado = validarCriacaoDemanda(dados)

  if (!resultado.success) {
    return { sucesso: false, erros: formatarErrosValidacao(resultado.error) }
  }

  return {
    sucesso: true,
    dados: {
      ...resultado.data,
      prioridade: calcularPrioridade(resultado.data.descricao),
    },
  }
}
