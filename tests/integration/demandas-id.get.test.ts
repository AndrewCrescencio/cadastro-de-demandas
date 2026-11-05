/**
 * Testes de integracao de GET /api/demandas/:id.
 *
 * Exercitam o endpoint HTTP completo (handler -> repositorio).
 * Sem banco de dados real: o armazenamento e mockado com vi.mock de server/utils/db,
 * ja que o repositorio (RNF-003) esta separado da interface e da logica de negocio.
 *
 * FR-018, RNF-001, RNF-003, RNF-004, RNF-006
 */

import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest'
import { createApp, createRouter, toNodeListener } from 'h3'
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

/**
 * Mock do banco. A consulta do repositorio chega aqui como
 * db.select().from(demandas).where(eq(demandas.id, id)): o valor do id vem
 * dentro de objetos `Param { value: <numero> }` do drizzle, encadeados na
 * condicao. Percorremos a condicao recursivamente (com protecao contra
 * referencias circulares dos objetos de coluna/tabela) e filtramos as
 * linhas pelo id extraido.
 */
function extrairIdsNumericos(obj: unknown, out: number[], visitados = new WeakSet<object>()): void {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return
  }

  if (visitados.has(obj)) {
    return
  }
  visitados.add(obj)

  if (Array.isArray(obj)) {
    for (const item of obj) {
      extrairIdsNumericos(item, out, visitados)
    }
    return
  }

  // Param { value: <numero> } do drizzle: folha, coleta o valor e nao desce mais
  const valor = (obj as { value?: unknown }).value
  const nomeClasse = (obj as { constructor?: { name?: string } })?.constructor?.name
  if (nomeClasse === 'Param' && typeof valor === 'number' && Number.isInteger(valor)) {
    out.push(valor)
    return
  }

  for (const chave of Object.keys(obj)) {
    extrairIdsNumericos((obj as Record<string, unknown>)[chave], out, visitados)
  }
}

vi.mock('../../server/utils/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(async (condicao: unknown) => {
          const ids: number[] = []
          extrairIdsNumericos(condicao, ids)

          if (ids.length > 0) {
            return linhas.filter((linha) => ids.includes(linha.id))
          }

          return [...linhas]
        }),
      })),
    })),
  },
}))

let servidor: ReturnType<typeof createServer>
let baseUrl: string

beforeAll(async () => {
  const handler = (await import('../../server/api/demandas/[id].get')).default

  const router = createRouter()
  router.get('/api/demandas/:id', handler)

  const app = createApp()
  app.use(router)

  servidor = createServer(toNodeListener(app))
  await new Promise<void>((resolve) => {
    servidor.listen(0, '127.0.0.1', () => resolve())
  })

  const endereco = servidor.address()
  if (endereco === null || typeof endereco === 'string') {
    throw new Error('Nao foi possivel iniciar o servidor de teste')
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
    titulo: 'Titulo padrao',
    descricao: 'Descricao padrao',
    dataSolicitacao: '2026-11-01',
    setor: 'Financeiro',
    status: 'Aberta',
    prioridade: 'Normal',
    criadoEm: new Date('2026-11-01T10:00:00Z'),
    ...sobrescricao,
  }
  linhas.push(linha)
  return linha
}

const get = (id: string) => fetch(`${baseUrl}/api/demandas/${id}`)

describe('GET /api/demandas/:id', () => {
  describe('FR-018: Detalhe devolve todos os campos (incluindo descricao completa)', () => {
    it('busca por id existente e retorna 200 com todos os campos', async () => {
      criarLinha({
        id: 42,
        titulo: 'Relatorio mensal',
        descricao: 'Erro ao gerar o relatorio mensal da divisao financeira',
        dataSolicitacao: '2026-10-31',
        setor: 'Financeiro',
        status: 'Aberta',
        prioridade: 'Alta',
        criadoEm: new Date('2026-11-01T08:15:00Z'),
      })

      const resposta = await get('42')
      expect(resposta.status).toBe(200)
      expect(resposta.headers.get('content-type')).toContain('application/json')

      const corpo = await resposta.json()
      expect(corpo).toMatchObject({
        id: 42,
        titulo: 'Relatorio mensal',
        descricao: 'Erro ao gerar o relatorio mensal da divisao financeira',
        dataSolicitacao: '2026-10-31',
        setor: 'Financeiro',
        status: 'Aberta',
        prioridade: 'Alta',
      })
      expect(corpo.criadoEm).toBeDefined()
      expect(new Date(corpo.criadoEm).getTime()).not.toBeNaN()

      // Sao exatamente os 8 campos esperados, nenhum a mais, nenhum a menos
      expect(Object.keys(corpo).sort()).toEqual([
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

    it('nao confunde demandas com ids semelhantes', async () => {
      criarLinha({ id: 1, titulo: 'Uma' })
      criarLinha({ id: 2, titulo: 'Dois' })
      criarLinha({ id: 10, titulo: 'Dez' })

      const resposta = await get('2')
      expect(resposta.status).toBe(200)

      const corpo = await resposta.json()
      expect(corpo.id).toBe(2)
      expect(corpo.titulo).toBe('Dois')
    })
  })

  describe('RNF-004: id inexistente ou formato invalido responde 404', () => {
    it('id existente mas sem demanda cadastrada responde 404 com mensagem clara em portugues', async () => {
      criarLinha({ id: 1 })

      const resposta = await get('999999')
      expect(resposta.status).toBe(404)

      const corpo = await resposta.json()
      expect(corpo.error).toBe('not_found')
      expect(typeof corpo.message).toBe('string')
      expect(corpo.message).toContain('999999')
      expect(corpo.message.toLowerCase()).toContain('não encontrada')
    })

    it.each([
      ['nao numerico', 'abc'],
      ['com decimais', '3.14'],
      ['com zeros a esquerda', '07'],
      ['negativo', '-5'],
      ['zero', '0'],
      ['com espaco', ' 8 '],
    ])('formato invalido "%s" responde 404 sem erro 500', async (_caso, id) => {
      criarLinha({ id: 8, titulo: 'Valida' })

      const resposta = await get(id)
      expect(resposta.status).toBe(404)

      const corpo = await resposta.json()
      expect(corpo.error).toBe('not_found')
      expect(typeof corpo.message).toBe('string')
      expect(corpo.message.length).toBeGreaterThan(0)
    })

    it('o endpoint continua funcionando depois de ids invalidos', async () => {
      await get('abc') // 404
      await get('-3') // 404

      criarLinha({ id: 1, titulo: 'Ainda funciona' })

      const resposta = await get('1')
      expect(resposta.status).toBe(200)
      expect((await resposta.json()).titulo).toBe('Ainda funciona')
    })
  })

  describe('RNF-006: texto devolvido puro, sem reinterpretacao', () => {
    it('descricao volta exatamente como foi salva (caracteres especiais e trechos tipo HTML)', async () => {
      const descricaoOriginal =
        "Erro <b>critico</b>: &quot;relatorio&quot; nao gerado &amp; linha '10' falhou — acentos: ção é ímpar"
      criarLinha({ id: 7, descricao: descricaoOriginal })

      const resposta = await get('7')
      expect(resposta.status).toBe(200)

      const corpo = await resposta.json()
      expect(corpo.descricao).toBe(descricaoOriginal)
      expect(corpo.descricao).toContain('<b>')
      expect(corpo.descricao).toContain('&amp;')
      expect(corpo.descricao).not.toBe(descricaoOriginal.replace(/[<>&]/g, ''))
    })

    it('titulo volta exatamente como foi salvo', async () => {
      const tituloOriginal = 'Relatorio: "urgente" & demais <script>teste</script>'
      criarLinha({ id: 9, titulo: tituloOriginal })

      const resposta = await get('9')
      expect(resposta.status).toBe(200)

      const corpo = await resposta.json()
      expect(corpo.titulo).toBe(tituloOriginal)
    })
  })
})
