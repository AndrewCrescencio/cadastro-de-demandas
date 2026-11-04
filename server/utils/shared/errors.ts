/**
 * Funções auxiliares para tratamento de erros HTTP.
 */

import { createError } from 'h3'

export interface ApiError {
  error: string
  message: string
}

export function sendApiError(status: number, error: string, message: string): never {
  throw createError({
    status,
    statusText: status.toString(),
    message: JSON.stringify({ error, message } satisfies ApiError),
  })
}

export function sendValidationError(message: string): never {
  sendApiError(400, 'validation_error', message)
}

export function sendConflictError(message: string): never {
  sendApiError(409, 'conflict', message)
}

export function sendNotFoundError(message: string): never {
  sendApiError(404, 'not_found', message)
}

export function sendForbiddenError(message: string): never {
  sendApiError(403, 'forbidden', message)
}

export function sendInternalError(message: string): never {
  sendApiError(500, 'internal_error', message)
}

/**
 * Trata erros do banco de dados.
 */
export function handleDatabaseError(error: unknown): never {
  if (error && typeof error === 'object' && 'code' in error) {
    const dbError = error as { code: string; message?: string }

    // Violação de constraint única
    if (dbError.code === '23505') {
      sendConflictError('Este registro já existe.')
    }

    // Violação de foreign key
    if (dbError.code === '23503') {
      sendValidationError('Referência inválida.')
    }
  }

  // Erro genérico do banco
  sendInternalError('Erro ao acessar o banco de dados.')
}
