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
import { parseDataBrasileira, hojeISO } from '#shared/utils/data'

export interface ErroValidacao {
  campo: string
  mensagem: string
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

const estaAusente = (valor: unknown): boolean => valor === undefined || valor === null

/**
 * Mensagem para campos de texto:
 * ausente (undefined/null) = obrigatório; outro tipo = inválido.
 */

/**
 * Sanitiza texto removendo tags HTML e escapando caracteres perigosos.
 * Preserva texto plano, caracteres portugueses e pontuação segura.
 * Implementação baseada em regex (sem dependência de DOM) para máxima
 * compatibilidade em qualquer ambiente Node.js/Nitro.
 *
 * @param texto - Texto a ser sanitizado
 * @returns Texto sanitizado sem tags HTML
 */
export function sanitizarTexto(texto: string): string {
  // 1. Remove script tags e todo conteúdo entre abertura e fechamento
  let semScripts = texto.replace(/<script[^\s>]*>[\s\S]*?<\/script>/gi, '')
  // 2. Remove style tags e todo conteúdo (previne CSS-based exfiltração)
  semScripts = semScripts.replace(/<style[^\s>]*>[\s\S]*?<\/style>/gi, '')
  // 3. Remove todas as demais tags HTML (img, iframe, a, div, span, etc.)
  const semTags = semScripts.replace(/<[^>]*>/g, '')
  // 4. Escapa caracteres que poderiam ser interpretados como HTML
  const escapado = semTags
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
  // 5. Remove espaços em branco nas extremidades
  return escapado.trim()
}

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
    .max(LIMITES.TITULO_MAX_CHARS, `Título não pode exceder ${LIMITES.TITULO_MAX_CHARS} caracteres`)
    .transform(sanitizarTexto)
    .refine((val) => val.length > 0, 'Título é obrigatório'),

  descricao: z
    .string({ error: erroTexto('Descrição é obrigatória', 'Descrição deve ser um texto') })
    .trim()
    .min(1, 'Descrição é obrigatória')
    .max(
      LIMITES.DESCRICAO_MAX_CHARS,
      `Descrição não pode exceder ${LIMITES.DESCRICAO_MAX_CHARS} caracteres`,
    )
    .transform(sanitizarTexto)
    .refine((val) => val.length > 0, 'Descrição é obrigatória'),

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

/**
 * Re-exporta as funções de data agora definidas em shared/utils/data.ts,
 * mantendo compatibilidade com importações existentes de validacao.ts.
 */
export {
  parseDataBrasileira,
  formatarDataBrasileira,
  hojeISO,
  FUSO_HORARIO,
} from '#shared/utils/data'
