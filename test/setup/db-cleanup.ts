/**
 * Utilitário de limpeza do banco de dados para testes.
 *
 * Garante isolamento entre testes limpando a tabela de demandas
 * antes e depois de cada suíte de testes.
 *
 * Uso:
 *   import { limparBanco } from '../../test/setup/db-cleanup'
 *   beforeEach(async () => { await limparBanco() })
 */

import { db } from '../../server/utils/db'
import { demandas } from '../../db/schema/demandas'

/**
 * Remove todas as demandas da tabela.
 * Útil para garantir estado limpo entre testes.
 */
export async function limparBanco() {
  await db.delete(demandas)
}
