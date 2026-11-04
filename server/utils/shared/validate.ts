/**
 * Utilitários de validação.
 */

import type { ZodSchema } from 'zod'
import { sendValidationError } from './errors'

/**
 * Valida dados com schema Zod e lança erro se inválido.
 *
 * @param schema - Schema Zod para validação
 * @param data - Dados a serem validados
 * @returns Dados validados e tipados
 * @throws Erro 400 com mensagens de validação
 */
export function validateOrThrow<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)

  if (!result.success) {
    const errors = result.error.errors
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join('; ')

    sendValidationError(errors)
  }

  return result.data
}

/**
 * Valida que um ID é um número positivo.
 */
export function validateId(id: string | number): number {
  const numId = typeof id === 'string' ? Number.parseInt(id, 10) : id

  if (Number.isNaN(numId) || numId <= 0) {
    sendValidationError('ID inválido')
  }

  return numId
}
