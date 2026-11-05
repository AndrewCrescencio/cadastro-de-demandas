/**
 * Testes de integração de GET /api/demandas/:id (detalhe).
 *
 * Exercitam o endpoint HTTP completo via @nuxt/test-utils (setup() sobe a
 * aplicação real; não se mocka o banco).
 *
 * FR-018, RNF-001, RNF-003, RNF-004, RNF-006
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
// eslint-disable-next-line import/no-duplicates
import { setup } from '@nuxt/test-utils'
// eslint-disable-next-line import/no-duplicates
import { $fetch } from '@nuxt/test-utils/e2e'
import { fileURLToPath } from 'node:url'
import { db } from '../../server/utils/db'
import { demandas } from '../../server/db/schema/demandas'

await setup({
  rootDir: fileURLToPath(new URL('../..', import.meta.url)),
})

async function limparBanco() {
  await db.delete(demandas)
}

const criar = async (demanda: Record<string, unknown>) =>
  $fetch('/api/demandas', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: demanda,
  })

const getPorId = async (id: string) => $fetch(`/api/demandas/${id}`)

const getPorIdEsperandoErro = async (id: string) => {
  try {
    await getPorId(id)
    return null
  } catch (error: unknown) {
    const e = error as { statusCode?: number; status?: number; data?: unknown }
    return { statusCode: e.statusCode ?? e.status, data: e.data }
  }
}

const baseDemanda = {
  titulo: 'Título padrão',
  descricao: 'Descrição padrão',
  dataSolicitacao: '01/11/2026',
  setor: 'Financeiro',
  status: 'Aberta',
}

beforeAll(async () => {
  await limparBanco()
})

beforeEach(async () => {
  await limparBanco()
})

describe('GET /api/demandas/:id', () => {
  describe('FR-018: Detalhe devolve todos os campos (incluindo descricao completa)', () => {
    it('id existente → 200 com todos os campos, incluindo descricao completa', async () => {
      const criada = await criar({
        ...baseDemanda,
        titulo: 'Relatório mensal',
        descricao: 'Erro ao gerar o relatório mensal da divisão financeira',
        dataSolicitacao: '31/10/2026',
        setor: 'Financeiro',
        status: 'Aberta',
      })

      const resposta = await getPorId(String(criada.id))

      expect(resposta).toMatchObject({
        id: criada.id,
        titulo: 'Relatório mensal',
        descricao: 'Erro ao gerar o relatório mensal da divisão financeira',
        dataSolicitacao: '2026-10-31',
        setor: 'Financeiro',
        status: 'Aberta',
        prioridade: 'Alta',
      })
      expect(resposta.criadoEm).toBeDefined()

      // São exatamente os 8 campos esperados
      expect(Object.keys(resposta).sort()).toEqual([
        'criadoEm',
        'dataSolicitacao',
        'descricao',
        'id',
        'prioridade',
        'setor',
        'status',
        'titulo',
      ])
    })

    it('não confunde demandas com ids semelhantes', async () => {
      const dois = await criar({ ...baseDemanda, titulo: 'Dois' })
      await criar({ ...baseDemanda, titulo: 'Uma' })
      await criar({ ...baseDemanda, titulo: 'Dez' })

      const resposta = await getPorId(String(dois.id))
      expect(resposta.id).toBe(dois.id)
      expect(resposta.titulo).toBe('Dois')
    })
  })

  describe('RNF-004: id inexistente ou formato inválido responde 404', () => {
    it('id existente mas sem demanda cadastrada → 404 com mensagem em português', async () => {
      await criar({ ...baseDemanda, id: 1 })

      const erro = await getPorIdEsperandoErro('999999')

      expect(erro).not.toBeNull()
      expect(erro!.statusCode).toBe(404)
      const corpo = erro!.data as { error: string; message: string }
      expect(corpo.error).toBe('not_found')
      expect(corpo.message).toContain('999999')
      expect(corpo.message.toLowerCase()).toContain('não encontrada')
    })

    it.each([
      ['não numérico', 'abc'],
      ['com decimais', '3.14'],
      ['com zeros à esquerda', '07'],
      ['negativo', '-5'],
      ['zero', '0'],
      ['com espaço', ' 8 '],
    ])('formato inválido "%s" → 404 sem erro 500', async (_caso, id) => {
      await criar({ ...baseDemanda, id: 8, titulo: 'Válida' })

      const erro = await getPorIdEsperandoErro(id)

      expect(erro).not.toBeNull()
      expect(erro!.statusCode).toBe(404)
      const corpo = erro!.data as { error: string }
      expect(corpo.error).toBe('not_found')
    })

    it('o endpoint continua funcionando depois de ids inválidos', async () => {
      await getPorIdEsperandoErro('abc') // 404
      await getPorIdEsperandoErro('-3') // 404

      const criada = await criar({ ...baseDemanda, id: 1, titulo: 'Ainda funciona' })

      const resposta = await getPorId(String(criada.id))
      expect(resposta.titulo).toBe('Ainda funciona')
    })
  })

  describe('RNF-006: texto devolvido puro, sem reinterpretacao', () => {
    it('descricao volta exatamente como foi salva (caracteres especiais e trechos tipo HTML)', async () => {
      const descricaoOriginal =
        "Erro <b>critico</b>: &quot;relatorio&quot; nao gerado &amp; linha '10' falhou — acentos: ção é ímpar"
      const criada = await criar({ ...baseDemanda, descricao: descricaoOriginal })

      const resposta = await getPorId(String(criada.id))

      expect(resposta.descricao).toBe(descricaoOriginal)
      expect(resposta.descricao).toContain('<b>')
      expect(resposta.descricao).toContain('&amp;')
      expect(resposta.descricao).not.toBe(descricaoOriginal.replace(/[<>&]/g, ''))
    })

    it('titulo volta exatamente como foi salvo', async () => {
      const tituloOriginal = 'Relatorio: "urgente" & demais <script>teste</script>'
      const criada = await criar({ ...baseDemanda, titulo: tituloOriginal })

      const resposta = await getPorId(String(criada.id))

      expect(resposta.titulo).toBe(tituloOriginal)
    })
  })
})
