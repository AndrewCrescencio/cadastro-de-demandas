/**
 * Testes de integração de GET /api/demandas.
 *
 * Exercitam o endpoint HTTP completo (handler → consulta pura → repositório).
 * Sem banco de dados real: o repositório é mockado via vi.mock de server/utils/db,
 * já que o repositório (RNF-003) está separado da interface e da lógica de negócio.
 *
 * FR-016, FR-017, FR-018, FR-019, RNF-001, RNF-003, RNF-004
 */

import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest'
import { createApp, toNodeListener } from 'h3'
import { createServer } from 'node:http'

type DemandaParaTeste = {
  id: number
  titulo: string
  descricao: string
  dataSolicitacao: string // ISO 8601 (YYYY-MM-DD)
  setor: string
  status: string
  prioridade: string
  criadoEm: Date
}

const linhas: DemandaParaTeste[] = []
let sequencia = 0

vi.mock('../../server/utils/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(async () => [...linhas]),
    })),
  },
}))

let servidor: ReturnType<typeof createServer>
let baseUrl: string

beforeAll(async () => {
  const handler = (await import('../../server/api/demandas/index.get')).default
  const app = createApp()
  app.use(handler)

  servidor = createServer(toNodeListener(app))
  await new Promise<void>((resolve) => {
    servidor.listen(0, '127.0.0.1', () => resolve())
  })

  const endereco = servidor.address()
  if (endereco === null || typeof endereco === 'string') {
    throw new Error('Não foi possível iniciar o servidor de teste')
  }
  baseUrl = `http://127.0.0.1:${endereco.port}`
})

afterAll(async () => {
  if (!servidor) return
  await new Promise<void>((resolve) => servidor.close(() => resolve()))
})

beforeEach(() => {
  vi.clearAllMocks()
  linhas.length = 0
  sequencia = 0
})

const criarLinha = (sobrescricao: Partial<DemandaParaTeste>): DemandaParaTeste => {
  sequencia += 1
  const linha: DemandaParaTeste = {
    id: sequencia,
    titulo: 'Título padrão',
    descricao: 'Descrição padrão',
    dataSolicitacao: '2026-11-01',
    setor: 'Financeiro',
    status: 'Aberta',
    prioridade: 'Normal',
    criadoEm: new Date(),
    ...sobrescricao,
  }
  linhas.push(linha)
  return linha
}

const get = (queryString: string) => fetch(`${baseUrl}/api/demandas${queryString}`)

const extrairLista = async (resposta: Response) => await resposta.json()

describe('GET /api/demandas', () => {
  describe('FR-016: Ordenação', () => {
    it('lista sem filtros ordena por data de solicitação decrescente', async () => {
      criarLinha({
        titulo: 'Mais antiga',
        dataSolicitacao: '2026-10-01',
        criadoEm: new Date('2026-10-01T10:00:00Z'),
      })
      criarLinha({
        titulo: 'Mais recente',
        dataSolicitacao: '2026-11-05',
        criadoEm: new Date('2026-11-05T10:00:00Z'),
      })
      criarLinha({
        titulo: 'Intermediária',
        dataSolicitacao: '2026-10-15',
        criadoEm: new Date('2026-10-15T10:00:00Z'),
      })

      const resposta = await get('')
      expect(resposta.status).toBe(200)

      const lista = await extrairLista(resposta)
      expect(lista).toHaveLength(3)
      expect(lista[0].titulo).toBe('Mais recente')
      expect(lista[1].titulo).toBe('Intermediária')
      expect(lista[2].titulo).toBe('Mais antiga')
    })

    it('em caso de empate na data, a cadastrada por último vem primeiro (criadoEm)', async () => {
      criarLinha({
        titulo: 'Primeira cadastrada',
        dataSolicitacao: '2026-11-01',
        criadoEm: new Date('2026-11-01T09:00:00Z'),
      })
      criarLinha({
        titulo: 'Segunda cadastrada',
        dataSolicitacao: '2026-11-01',
        criadoEm: new Date('2026-11-01T11:00:00Z'),
      })

      const resposta = await get('')
      expect(resposta.status).toBe(200)

      const lista = await extrairLista(resposta)
      expect(lista).toHaveLength(2)
      expect(lista[0].titulo).toBe('Segunda cadastrada')
      expect(lista[1].titulo).toBe('Primeira cadastrada')
    })
  })

  describe('FR-019: Lista vazia', () => {
    it('nenhuma demanda cadastrada responde 200 com lista vazia', async () => {
      const resposta = await get('')
      expect(resposta.status).toBe(200)

      const lista = await extrairLista(resposta)
      expect(lista).toEqual([])
    })

    it('filtros sem resultado respondem 200 com lista vazia (não é erro)', async () => {
      criarLinha({ status: 'Aberta', setor: 'TI' })

      const resposta = await get('?status=Concluída&setor=Comercial')
      expect(resposta.status).toBe(200)

      const lista = await extrairLista(resposta)
      expect(lista).toEqual([])
    })
  })

  describe('FR-017: Filtros (E lógico)', () => {
    beforeEach(() => {
      criarLinha({ titulo: 'Aberta TI Alta', status: 'Aberta', setor: 'TI', prioridade: 'Alta' })
      criarLinha({
        titulo: 'Aberta Comercial Normal',
        status: 'Aberta',
        setor: 'Comercial',
        prioridade: 'Normal',
      })
      criarLinha({
        titulo: 'Concluída TI Normal',
        status: 'Concluída',
        setor: 'TI',
        prioridade: 'Normal',
      })
    })

    it('filtro por Status isolado', async () => {
      const resposta = await get('?status=Concluída')
      expect(resposta.status).toBe(200)

      const lista = await extrairLista(resposta)
      expect(lista).toHaveLength(1)
      expect(lista[0].titulo).toBe('Concluída TI Normal')
    })

    it('filtro por Setor isolado', async () => {
      const resposta = await get('?setor=Comercial')
      expect(resposta.status).toBe(200)

      const lista = await extrairLista(resposta)
      expect(lista).toHaveLength(1)
      expect(lista[0].titulo).toBe('Aberta Comercial Normal')
    })

    it('filtro por Prioridade isolado', async () => {
      const resposta = await get('?prioridade=Normal')
      expect(resposta.status).toBe(200)

      const lista = await extrairLista(resposta)
      expect(lista).toHaveLength(2)
      expect(lista.map((d: { titulo: string }) => d.titulo).sort()).toEqual([
        'Aberta Comercial Normal',
        'Concluída TI Normal',
      ])
    })

    it('combinação de dois filtros é E lógico (não OU)', async () => {
      const resposta = await get('?status=Aberta&setor=TI')
      expect(resposta.status).toBe(200)

      const lista = await extrairLista(resposta)
      expect(lista).toHaveLength(1)
      expect(lista[0].titulo).toBe('Aberta TI Alta')
    })

    it('combinação de três filtros é E lógico', async () => {
      const resposta = await get('?status=Aberta&setor=TI&prioridade=Alta')
      expect(resposta.status).toBe(200)

      const lista = await extrairLista(resposta)
      expect(lista).toHaveLength(1)
      expect(lista[0].titulo).toBe('Aberta TI Alta')
    })

    it('combinação de três filtros com nenhum correspondente retorna lista vazia, não erro', async () => {
      const resposta = await get('?status=Cancelada&setor=RH&prioridade=Alta')
      expect(resposta.status).toBe(200)

      const lista = await extrairLista(resposta)
      expect(lista).toEqual([])
    })
  })

  describe('RNF-004: Filtro inválido responde 400', () => {
    it('status fora da lista permitida', async () => {
      const resposta = await get('?status=Inexistente')
      expect(resposta.status).toBe(400)

      const corpo = await resposta.json()
      expect(corpo.error).toBe('validation_error')
      expect(corpo.message).toContain('status')
      expect(corpo.message).toContain('Inexistente')
    })

    it('setor fora da lista permitida', async () => {
      const resposta = await get('?setor=SetorFalso')
      expect(resposta.status).toBe(400)

      const corpo = await resposta.json()
      expect(corpo.error).toBe('validation_error')
      expect(corpo.message).toContain('setor')
      expect(corpo.message).toContain('SetorFalso')
    })

    it('prioridade fora da lista permitida', async () => {
      const resposta = await get('?prioridade=Urgente')
      expect(resposta.status).toBe(400)

      const corpo = await resposta.json()
      expect(corpo.error).toBe('validation_error')
      expect(corpo.message).toContain('prioridade')
      expect(corpo.message).toContain('Urgente')
    })

    it('múltiplos filtros inválidos reportam todos de uma vez', async () => {
      const resposta = await get('?status=X&setor=Y')
      expect(resposta.status).toBe(400)

      const corpo = await resposta.json()
      expect(corpo.message).toContain('status')
      expect(corpo.message).toContain('setor')
    })

    it('o endpoint continua funcionando após um filtro inválido', async () => {
      await get('?status=Invalido') // 400

      const resposta = await get('?status=Aberta')
      expect(resposta.status).toBe(200)
    })
  })

  describe('FR-018: Listagem não traz descrição completa', () => {
    it('cada item da listagem tem apenas os campos permitidos', async () => {
      criarLinha({ titulo: 'Com descrição', descricao: 'Descrição completa que não deve aparecer' })

      const resposta = await get('')
      expect(resposta.status).toBe(200)

      const lista = await extrairLista(resposta)
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
