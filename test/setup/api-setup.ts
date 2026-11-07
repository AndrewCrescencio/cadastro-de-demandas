/**
 * Setup para testes de integração da API.
 *
 * Fornece limpeza automática do banco de dados antes de cada teste,
 * garantindo isolamento entre testes.
 *
 * Uso em cada arquivo de teste:
 *
 *   import { limparBanco } from '../setup/db-cleanup'
 *
 *   describe('Meus testes', () => {
 *     beforeEach(async () => {
 *       await limparBanco()
 *     })
 *
 *     test('...', async () => { ... })
 *   })
 */

import { limparBanco } from './db-cleanup'

export { limparBanco }
