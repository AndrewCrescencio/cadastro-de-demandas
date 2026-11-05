/**
 * Funções puras de manipulação de data no formato brasileiro (DD/MM/AAAA).
 *
 * Reaproveitáveis tanto pelo servidor (validacao.ts) quanto pelo cliente
 * (DemandaForm.vue), sem dependência de Zod nem de nada server-only.
 *
 * FR-005: Data válida, não futura; "hoje" calculado no fuso America/Sao_Paulo.
 */

export const FUSO_HORARIO = 'America/Sao_Paulo'

/**
 * Converte data DD/MM/AAAA para objeto Date.
 * Retorna null para data inexistente (ex.: 31/02).
 */
export function parseDataBrasileira(dataStr: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dataStr)
  if (!match) return null

  const dia = Number(match[1])
  const mes = Number(match[2])
  const ano = Number(match[3])
  const data = new Date(ano, mes - 1, dia)

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
