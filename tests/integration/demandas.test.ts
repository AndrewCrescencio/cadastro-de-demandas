/**
 * Testes de integração de POST /api/demandas.
 *
 * Exercitam o endpoint HTTP completo (handler → validação/cálculo de prioridade → repositório).
 * Sem banco de dados real: o armazenamento é mockado com vi.mock de server/utils/db,
 * já que o repositório (RNF-003) está separado da interface e da lógica de negócio.
 *
 * FR-001 a FR-005, FR-008, FR-010 a FR-014, RNF-001, RNF-003
 */

import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest'
import { createApp, toNodeListener } from 'h3'
import { createServer } from 'node:http'
import { db } from '../../server/utils/db'

const linhas: unknown[] = []
let sequencia = 0

vi.mock('../../server/utils/db', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn((dados: Record<string, unknown>) => {
        sequencia += 1
        const linha = { ...dados, id: sequencia, criadoEm: new Date() }
        linhas.push(linha)
        return { returning: vi.fn(async () => [linha]) }
      }),
    })),
  },
}))

let servidor: ReturnType<typeof createServer>
let baseUrl: string

beforeAll(async () => {
  const handler = (await import('../../server/api/demandas/index.post')).default
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

const dadosValidos = {
  titulo: 'Relatório mensal',
  descricao: 'Erro ao gerar o relatório mensal',
  dataSolicitacao: '01/11/2026',
  setor: 'Financeiro',
  status: 'Aberta',
}

const post = (body: unknown) =>
  fetch(`${baseUrl}/api/demandas`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

const extrairErros = async (resposta: Response) =>
  (await resposta.json()) as { campo: string; mensagem: string }[]

describe('POST /api/demandas', () => {
  describe('Sucesso (FR-001, FR-008)', () => {
    it('cadastra uma demanda válida e retorna 201 com o registro completo', async () => {
      const resposta = await post(dadosValidos)

      expect(resposta.status).toBe(201)
      expect(resposta.headers.get('content-type')).toContain('application/json')

      const corpo = await resposta.json()
      expect(corpo).toMatchObject({
        id: expect.any(Number),
        titulo: 'Relatório mensal',
        descricao: 'Erro ao gerar o relatório mensal',
        dataSolicitacao: '2026-11-01',
        setor: 'Financeiro',
        status: 'Aberta',
        prioridade: 'Alta', // "erro" na descrição (FR-010)
      })
      expect(corpo.criadoEm).toBeDefined()
      expect(new Date(corpo.criadoEm).getTime()).not.toBeNaN()

      expect(vi.mocked(db.insert)).toHaveBeenCalledTimes(1)
    })
  })

  describe('FR-003: validação falha — todos os erros de uma vez, nada gravado', () => {
    it.each([
      ['titulo', { ...dadosValidos, titulo: '' }],
      ['descricao', { ...dadosValidos, descricao: '' }],
      ['dataSolicitacao', { ...dadosValidos, dataSolicitacao: '' }],
      ['setor', { ...dadosValidos, setor: '' }],
      ['status', { ...dadosValidos, status: '' }],
    ])('rejeita quando %s está vazio', async (campo, corpo) => {
      const resposta = await post(corpo)
      expect(resposta.status).toBe(422)

      const erros = await extrairErros(resposta)
      expect(Array.isArray(erros) && erros.length).toBeGreaterThan(0)
      expect(erros.some((e) => e.campo === campo)).toBe(true)

      expect(vi.mocked(db.insert)).not.toHaveBeenCalled()
    })

    it('rejeita quando cada campo obrigatório está ausente', async () => {
      const campos = ['titulo', 'descricao', 'dataSolicitacao', 'setor', 'status'] as const

      for (const campo of campos) {
        const restante = Object.fromEntries(
          Object.entries(dadosValidos).filter(([chave]) => chave !== campo),
        )
        const resposta = await post(restante)
        expect(resposta.status).toBe(422)

        const erros = await extrairErros(resposta)
        expect(erros.some((e) => e.campo === campo)).toBe(true)
      }

      expect(vi.mocked(db.insert)).not.toHaveBeenCalled()
    })

    it('devolve todos os campos inválidos de uma vez quando vários faltam', async () => {
      const resposta = await post({ status: 'Aberta' })
      expect(resposta.status).toBe(422)

      const erros = await extrairErros(resposta)
      const campos = erros.map((e) => e.campo)
      expect(campos).toContain('titulo')
      expect(campos).toContain('descricao')
      expect(campos).toContain('dataSolicitacao')
      expect(campos).toContain('setor')
      expect(campos).not.toContain('status')

      expect(vi.mocked(db.insert)).not.toHaveBeenCalled()
    })

    it('recusa corpo vazio listando todos os campos obrigatórios', async () => {
      const resposta = await post({})
      expect(resposta.status).toBe(422)

      const erros = await extrairErros(resposta)
      expect(erros.map((e) => e.campo).sort()).toEqual([
        'dataSolicitacao',
        'descricao',
        'setor',
        'status',
        'titulo',
      ])

      expect(vi.mocked(db.insert)).not.toHaveBeenCalled()
    })
  })

  describe('FR-005: data de solicitação não pode ser futura', () => {
    it('recusa data futura', async () => {
      const resposta = await post({ ...dadosValidos, dataSolicitacao: '01/01/2027' })
      expect(resposta.status).toBe(422)

      const erros = await extrairErros(resposta)
      expect(erros.some((e) => e.campo === 'dataSolicitacao' && /futura/i.test(e.mensagem))).toBe(
        true,
      )

      expect(vi.mocked(db.insert)).not.toHaveBeenCalled()
    })
  })

  describe('FR-010 a FR-014: prioridade calculada automaticamente (ignora o cliente)', () => {
    it.each([
      ['urgente minúsculo', 'Preciso do acesso liberado, é urgente'],
      ['URGENTE maiúsculo', 'É URGENTE: contrato precisa de assinatura hoje'],
      ['urgentes plural', 'Temos questões urgentes para resolver'],
      ['erro minúsculo', 'Erro ao gerar o relatório mensal'],
      ['ERRO maiúsculo', 'FALHA: ERRO no cálculo da fatura'],
      ['erros plural', 'Corrigir erros na planilha de custos'],
    ])('descrição com %s resulta em prioridade Alta', async (_caso, descricao) => {
      const resposta = await post({ ...dadosValidos, descricao })
      expect(resposta.status).toBe(201)

      const corpo = await resposta.json()
      expect(corpo.prioridade).toBe('Alta')
    })

    it('descrição sem palavras-chave resulta em prioridade Normal', async () => {
      const resposta = await post({
        ...dadosValidos,
        descricao: 'Criar relatório de vendas por região',
      })
      expect(resposta.status).toBe(201)

      const corpo = await resposta.json()
      expect(corpo.prioridade).toBe('Normal')
    })

    it('ignora prioridade enviada pelo cliente e calcula a partir da descrição', async () => {
      const resposta = await post({
        ...dadosValidos,
        descricao: 'rotina normal de atendimento',
        prioridade: 'Alta', // tentativa de forçar — deve ser ignorada
      })
      expect(resposta.status).toBe(201)

      const corpo = await resposta.json()
      expect(corpo.prioridade).toBe('Normal')

      // O valor gravado pelo repositório é o calculado, não o enviado pelo cliente
      const gravado = linhas[linhas.length - 1] as Record<string, unknown>
      expect(gravado.prioridade).toBe('Normal')
    })
  })
})
