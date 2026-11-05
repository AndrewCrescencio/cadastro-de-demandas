/**
 * Testes de integração de GET /api/demandas (listagem).
 *
 * Exercitam o endpoint HTTP completo via @nuxt/test-utils (setup() sobe a
 * aplicação real; não se mocka o banco).
 *
 * FR-016, FR-017, FR-018, FR-019, RNF-001, RNF-003, RNF-004
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

const get = async (queryString: string) => $fetch(`/api/demandas${queryString}`)

const getEsperandoErro = async (queryString: string) => {
  try {
    await get(queryString)
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

describe('GET /api/demandas', () => {
  describe('FR-019: Lista vazia', () => {
    it('nenhuma demanda cadastrada → 200 com lista vazia', async () => {
      const lista = await get('')
      expect(Array.isArray(lista) && lista.length).toBe(0)
    })

    it('filtros sem resultado → 200 com lista vazia (não é erro)', async () => {
      await criar({ ...baseDemanda, status: 'Aberta', setor: 'TI' })

      const lista = await get('?status=Concluída&setor=Comercial')
      expect(Array.isArray(lista) && lista.length).toBe(0)
    })
  })

  describe('FR-016: Ordenação', () => {
    it('ordena por data de solicitação decrescente', async () => {
      await criar({ ...baseDemanda, titulo: 'Mais antiga', dataSolicitacao: '01/10/2026' })
      await criar({ ...baseDemanda, titulo: 'Mais recente', dataSolicitacao: '05/11/2026' })
      await criar({ ...baseDemanda, titulo: 'Intermediária', dataSolicitacao: '15/10/2026' })

      const lista = await get('')
      expect(lista).toHaveLength(3)
      expect(lista[0].titulo).toBe('Mais recente')
      expect(lista[1].titulo).toBe('Intermediária')
      expect(lista[2].titulo).toBe('Mais antiga')
    })

    it('empate na data → desempate pela mais recente no cadastro (criadoEm)', async () => {
      await criar({ ...baseDemanda, titulo: 'Primeira cadastrada', dataSolicitacao: '01/11/2026' })
      await criar({ ...baseDemanda, titulo: 'Segunda cadastrada', dataSolicitacao: '01/11/2026' })

      const lista = await get('')
      expect(lista).toHaveLength(2)
      expect(lista[0].titulo).toBe('Segunda cadastrada')
      expect(lista[1].titulo).toBe('Primeira cadastrada')
    })
  })

  describe('FR-017: Filtros (E lógico)', () => {
    beforeEach(async () => {
      await criar({
        ...baseDemanda,
        titulo: 'Aberta TI Alta',
        descricao: 'Erro no sistema TI',
        status: 'Aberta',
        setor: 'TI',
      })
      await criar({
        ...baseDemanda,
        titulo: 'Aberta Comercial Normal',
        descricao: 'Rotina normal de vendas',
        status: 'Aberta',
        setor: 'Comercial',
      })
      await criar({
        ...baseDemanda,
        titulo: 'Concluída TI Normal',
        descricao: 'Tarefa concluída sem urgência',
        status: 'Concluída',
        setor: 'TI',
      })
    })

    it('filtro por Status isolado', async () => {
      const lista = await get('?status=Concluída')
      expect(lista).toHaveLength(1)
      expect(lista[0].titulo).toBe('Concluída TI Normal')
    })

    it('filtro por Setor isolado', async () => {
      const lista = await get('?setor=Comercial')
      expect(lista).toHaveLength(1)
      expect(lista[0].titulo).toBe('Aberta Comercial Normal')
    })

    it('filtro por Prioridade isolado', async () => {
      const lista = await get('?prioridade=Normal')
      expect(lista).toHaveLength(2)
      const titulos = lista.map((d: { titulo: string }) => d.titulo).sort()
      expect(titulos).toEqual(['Aberta Comercial Normal', 'Concluída TI Normal'])
    })

    it('combinação de dois filtros é E lógico (não OU)', async () => {
      const lista = await get('?status=Aberta&setor=TI')
      expect(lista).toHaveLength(1)
      expect(lista[0].titulo).toBe('Aberta TI Alta')
    })

    it('combinação de três filtros é E lógico', async () => {
      const lista = await get('?status=Aberta&setor=TI&prioridade=Alta')
      expect(lista).toHaveLength(1)
      expect(lista[0].titulo).toBe('Aberta TI Alta')
    })

    it('combinação de três filtros sem correspondente → lista vazia, não erro', async () => {
      const lista = await get('?status=Cancelada&setor=RH&prioridade=Alta')
      expect(Array.isArray(lista) && lista.length).toBe(0)
    })

    it('demanda que bate só com parte dos filtros não aparece (E lógico)', async () => {
      // 'Aberta Comercial Normal' bate com status=Aberta mas não com setor=TI
      const lista = await get('?status=Aberta&setor=TI')
      expect(lista).toHaveLength(1)
      expect(lista[0].titulo).toBe('Aberta TI Alta')
    })
  })

  describe('RNF-004: Filtro inválido responde 400', () => {
    it('status fora da lista permitida → 400 com mensagem clara', async () => {
      const erro = await getEsperandoErro('?status=Inexistente')

      expect(erro).not.toBeNull()
      expect(erro!.statusCode).toBe(400)
      const corpo = erro!.data as { error: string; message: string }
      expect(corpo.error).toBe('validation_error')
      expect(corpo.message).toContain('status')
      expect(corpo.message).toContain('Inexistente')
    })

    it('setor fora da lista permitida → 400', async () => {
      const erro = await getEsperandoErro('?setor=SetorFalso')

      expect(erro!.statusCode).toBe(400)
      const corpo = erro!.data as { message: string }
      expect(corpo.message).toContain('setor')
      expect(corpo.message).toContain('SetorFalso')
    })

    it('prioridade fora da lista permitida → 400', async () => {
      const erro = await getEsperandoErro('?prioridade=Urgente')

      expect(erro!.statusCode).toBe(400)
      const corpo = erro!.data as { message: string }
      expect(corpo.message).toContain('prioridade')
      expect(corpo.message).toContain('Urgente')
    })

    it('múltiplos filtros inválidos reportam todos de uma vez', async () => {
      const erro = await getEsperandoErro('?status=X&setor=Y')

      expect(erro!.statusCode).toBe(400)
      const corpo = erro!.data as { message: string }
      expect(corpo.message).toContain('status')
      expect(corpo.message).toContain('setor')
    })
  })

  describe('FR-018: Listagem não traz descrição completa', () => {
    it('cada item da listagem tem apenas os campos permitidos (sem descricao)', async () => {
      await criar({
        ...baseDemanda,
        titulo: 'Com descrição',
        descricao: 'Descrição completa que não deve aparecer na listagem',
      })

      const lista = await get('')
      expect(lista).toHaveLength(1)
      expect(lista[0]).toMatchObject({
        id: expect.any(Number),
        titulo: 'Com descrição',
        dataSolicitacao: '2026-11-01',
        setor: 'Financeiro',
        status: 'Aberta',
        prioridade: 'Normal',
      })
      expect(lista[0].descricao).toBeUndefined()
    })
  })
})
