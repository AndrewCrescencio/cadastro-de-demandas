/**
 * Regra de prioridade automática para demandas.
 *
 * FR-010 a FR-015: Prioridade definida automaticamente pela descrição
 * P-3: Palavra inteira, case-insensitive, aceita plural
 * P-4: Variações não ativam (ex: "urgência", "urgentemente")
 * P-5: Negação não é interpretada
 * RNF-001: Lógica isolada e testável
 */

import type { Prioridade } from './config'
import { PALAVRAS_CHAVE_ALTA_PRIORIDADE } from './config'

// Tipos diretos
type PalavraChave = (typeof PALAVRAS_CHAVE_ALTA_PRIORIDADE)[number]

/**
 * Calcula a prioridade de uma demanda baseada em sua descrição.
 */
export function calcularPrioridade(descricao: string): Prioridade {
  if (!descricao || typeof descricao !== 'string') {
    return 'Normal'
  }

  const descricaoNormalizada = descricao.toLowerCase()

  // Buscar palavras inteiras usando word boundary
  for (const palavra of PALAVRAS_CHAVE_ALTA_PRIORIDADE) {
    const regex = new RegExp(`\\b${palavra}\\b`, 'i')
    if (regex.test(descricaoNormalizada)) {
      return 'Alta'
    }
  }

  return 'Normal'
}

/**
 * Identifica palavras-chave presentes na descrição.
 */
export function identificarPalavrasChave(descricao: string): PalavraChave[] {
  if (!descricao || typeof descricao !== 'string') {
    return []
  }

  const descricaoNormalizada = descricao.toLowerCase()
  const encontradas: PalavraChave[] = []

  for (const palavra of PALAVRAS_CHAVE_ALTA_PRIORIDADE) {
    const regex = new RegExp(`\\b${palavra}\\b`, 'i')
    if (regex.test(descricaoNormalizada)) {
      encontradas.push(palavra)
    }
  }

  return encontradas
}
