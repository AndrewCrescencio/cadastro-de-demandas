/**
 * Error handler global do Nitro.
 * Normaliza erros para o formato { error, message } e previne vazamento de informações.
 */

import { defineNitroErrorHandler } from 'nitropack/runtime'
import { send, setResponseHeaders, setResponseStatus } from 'h3'
import type { ApiError } from './utils/shared/errors'

export interface NormalizedError {
  status: number
  body: ApiError
}

/**
 * Normaliza erros para o formato padrão da API.
 * - Erros < 500 com formato { error, message }: repassados intactos
 * - Outros erros: convertidos para internal_error (sem vazar detalhes)
 */
export function normalizeError(error: unknown): NormalizedError {
  const candidate =
    typeof error === 'object' && error !== null
      ? (error as { statusCode?: number; status?: number; message?: string })
      : undefined

  const status = candidate?.statusCode ?? candidate?.status ?? 500
  const rawMessage = typeof candidate?.message === 'string' ? candidate.message : ''

  // Tentar parsear como ApiError se < 500
  if (status < 500 && rawMessage) {
    try {
      const parsed = JSON.parse(rawMessage) as unknown
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        typeof (parsed as ApiError).error === 'string' &&
        typeof (parsed as ApiError).message === 'string'
      ) {
        return {
          status,
          body: { error: (parsed as ApiError).error, message: (parsed as ApiError).message },
        }
      }
    } catch {
      // Não é JSON válido - tratar como erro interno
    }
  }

  // Erro 500 ou formato inválido - não vazar detalhes
  return { status: 500, body: { error: 'internal_error', message: 'Erro interno do servidor' } }
}

export default defineNitroErrorHandler((error, event) => {
  const normalized = normalizeError(error)

  // Log de erros 500 para debugging
  if (normalized.status >= 500) {
    console.error('Erro não tratado:', error)
  }

  setResponseStatus(event, normalized.status)
  setResponseHeaders(event, { 'content-type': 'application/json' })
  return send(event, JSON.stringify(normalized.body))
})
