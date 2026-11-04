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

/**
 * Calcula a prioridade de uma demanda baseada em sua descrição.
 *
 * @param descricao - Texto da descrição da demanda
 * @returns "Alta" se contiver palavras-chave, "Normal" caso contrário
 *
 * @example
 * calcularPrioridade("Erro ao gerar relatório") // "Alta"
 * calcularPrioridade("Criar novo relatório") // "Normal"
 * calcularPrioridade("O terror dos prazos") // "Normal" (palavra dentro de outra)
 */
export function calcularPrioridade(descricao: string): Prioridade {
  // FR-013: Somente a descrição é avaliada (título não influencia)
  if (!descricao || typeof descricao !== 'string') {
    return 'Normal'
  }

  // FR-012: Ignorar maiúsculas/minúsculas
  const descricaoNormalizada = descricao.toLowerCase()

  // P-3: Buscar palavras inteiras, não trechos
  // Word boundary \b garante que não pegue "erro" dentro de "terror"
  for (const palavra of PALAVRAS_CHAVE_ALTA_PRIORIDADE) {
    // Cria regex para palavra completa, case-insensitive
    // \b = word boundary (início/fim da string, espaço, pontuação)
    const regex = new RegExp(`\\b${palavra}\\b`, 'i')

    if (regex.test(descricaoNormalizada)) {
      return 'Alta'
    }
  }

  return 'Normal'
}

/**
 * Testa se uma descrição contém palavras-chave de alta prioridade.
 * Útil para dar feedback ao usuário.
 *
 * @param descricao - Texto da descrição
 * @returns Array com as palavras-chave encontradas
 */
export function identificarPalavrasChave(descricao: string): string[] {
  if (!descricao || typeof descricao !== 'string') {
    return []
  }

  const descricaoNormalizada = descricao.toLowerCase()
  const encontradas: string[] = []

  for (const palavra of PALAVRAS_CHAVE_ALTA_PRIORIDADE) {
    const regex = new RegExp(`\\b${palavra}\\b`, 'i')
    if (regex.test(descricaoNormalizada)) {
      encontradas.push(palavra)
    }
  }

  return encontradas
}
