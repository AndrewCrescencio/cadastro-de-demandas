/**
 * Regra de prioridade automática para demandas.
 *
 * FR-010 a FR-015: Prioridade definida automaticamente pela descrição
 * P-3: Palavra inteira, case-insensitive, aceita plural
 * P-4: Variações não ativam (ex: "urgência", "urgentemente")
 * P-5: Negação não é interpretada
 * RNF-001: Lógica isolada e testável
 */

import { PALAVRAS_CHAVE_ALTA_PRIORIDADE } from './config'
import type { PalavraChave, Prioridade } from './config'

/**
 * Quebra o texto em palavras (letras e números, com acentos), em minúsculas.
 * Pontuação, hífen e espaços separam palavras: "ERRO: falha!" -> {"erro", "falha"}.
 */
function extrairPalavras(texto: string): Set<string> {
  return new Set(texto.toLowerCase().split(/[^\p{L}\p{N}]+/u))
}

/**
 * Identifica palavras-chave de alta prioridade presentes na descrição.
 * Aceita a palavra inteira e o plural regular (+s); variações não ativam.
 */
export function identificarPalavrasChave(descricao: string): PalavraChave[] {
  if (typeof descricao !== 'string') return []

  const palavras = extrairPalavras(descricao)
  return PALAVRAS_CHAVE_ALTA_PRIORIDADE.filter(
    (palavra) => palavras.has(palavra) || palavras.has(`${palavra}s`),
  )
}

/**
 * Calcula a prioridade de uma demanda baseada em sua descrição.
 */
export function calcularPrioridade(descricao: string): Prioridade {
  return identificarPalavrasChave(descricao).length > 0 ? 'Alta' : 'Normal'
}
