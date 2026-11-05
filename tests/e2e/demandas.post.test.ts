/**
 * Testes de integração de POST /api/demandas.
 *
 * Exercitam o endpoint HTTP completo via @nuxt/test-utils (setup() sobe a
 * aplicação real; não se mocka o banco nem se chamam funções de validação
 * diretamente).
 *
 * FR-001 a FR-005, FR-008, FR-010 a FR-014, RNF-001, RNF-003
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

const dadosValidos = {
  titulo: 'Relatório mensal',
  descricao: 'Criar relatório de vendas por região',
  dataSolicitacao: '01/11/2026',
  setor: 'Financeiro',
  status: 'Aberta',
}

const post = async (body: unknown) =>
  $fetch('/api/demandas', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  })

const postEsperandoErro = async (body: unknown) => {
  try {
    await post(body)
    return null
  } catch (error: unknown) {
    const e = error as { statusCode?: number; status?: number; data?: unknown }
    return { statusCode: e.statusCode ?? e.status, data: e.data }
  }
}

beforeAll(async () => {
  await limparBanco()
})

beforeEach(async () => {
  await limparBanco()
})

describe('POST /api/demandas', () => {
  describe('Sucesso (FR-001, FR-008)', () => {
    it('cadastra uma demanda válida sem palavra-chave → 201, prioridade Normal', async () => {
      const resposta = await post(dadosValidos)

      expect(resposta).toMatchObject({
        id: expect.any(Number),
        titulo: 'Relatório mensal',
        descricao: 'Criar relatório de vendas por região',
        dataSolicitacao: '2026-11-01',
        setor: 'Financeiro',
        status: 'Aberta',
        prioridade: 'Normal',
      })
      expect(resposta.criadoEm).toBeDefined()
    })

    it('resposta de sucesso inclui id único e prioridade atribuída (FR-012)', async () => {
      const resposta = await post(dadosValidos)

      expect(resposta.id).toBeGreaterThan(0)
      expect(resposta.prioridade).toBe('Normal')
    })
  })

  describe('Anexo A — exemplos de prioridade (it.each)', () => {
    it.each([
      // [descricao do caso, descricao, prioridade esperada]
      ['erro minúsculo', 'Erro ao gerar o relatório mensal', 'Alta'],
      ['urgente minúsculo', 'Preciso do acesso liberado, é urgente', 'Alta'],
      ['URGENTE maiúsculo', 'URGENTE: contrato precisa de assinatura hoje', 'Alta'],
      ['erros plural', 'Corrigir erros na planilha de custos', 'Alta'],
      ['erro com pontuação', 'Valor divergente: erro-01 no cálculo da fatura', 'Alta'],
      ['urgente com negação', 'Não é urgente, mas gostaria de um novo modelo de relatório', 'Alta'],
      ['sem palavras-chave', 'Criar relatório de vendas por região', 'Normal'],
      [
        'interrompe (erro dentro de palavra)',
        'Ajustar a rotina que interrompe o envio das notas',
        'Normal',
      ],
      ['terror (erro dentro de palavra)', 'O terror dos prazos precisa ser discutido', 'Normal'],
      ['palavra-chave só no título', 'Criar relatório de vendas', 'Normal'],
      ['urgentemente (variação não é palavra-chave)', 'Precisamos disso urgentemente', 'Normal'],
    ])('descrição "%s" → prioridade %s', async (_caso, descricao, esperada) => {
      const resposta = await post({ ...dadosValidos, descricao })

      expect(resposta).toMatchObject({ prioridade: esperada })
    })
  })

  describe('FR-003: validação — todos os erros de uma vez, nada gravado', () => {
    it.each([
      ['titulo', { ...dadosValidos, titulo: '' }],
      ['descricao', { ...dadosValidos, descricao: '' }],
      ['dataSolicitacao', { ...dadosValidos, dataSolicitacao: '' }],
      ['setor', { ...dadosValidos, setor: '' }],
      ['status', { ...dadosValidos, status: '' }],
    ])('rejeita quando %s está vazio → 422 com mensagem do campo', async (_campo, corpo) => {
      const erro = await postEsperandoErro(corpo)

      expect(erro).not.toBeNull()
      expect(erro!.statusCode).toBe(422)

      const erros = erro!.data as { campo: string; mensagem: string }[]
      expect(Array.isArray(erros) && erros.length).toBeGreaterThan(0)
      expect(erros.some((e) => e.campo === _campo)).toBe(true)
    })

    it('campo de texto só com espaços é tratado como vazio', async () => {
      const erro = await postEsperandoErro({ ...dadosValidos, titulo: '   ' })

      expect(erro!.statusCode).toBe(422)
      const erros = erro!.data as { campo: string }[]
      expect(erros.some((e) => e.campo === 'titulo')).toBe(true)
    })

    it('vários campos obrigatórios vazios → lista TODOS de uma vez', async () => {
      const erro = await postEsperandoErro({ status: 'Aberta' })

      expect(erro!.statusCode).toBe(422)
      const erros = erro!.data as { campo: string }[]
      const campos = erros.map((e) => e.campo)
      expect(campos).toContain('titulo')
      expect(campos).toContain('descricao')
      expect(campos).toContain('dataSolicitacao')
      expect(campos).toContain('setor')
      expect(campos).not.toContain('status')
    })

    it('corpo vazio → lista todos os campos obrigatórios', async () => {
      const erro = await postEsperandoErro({})

      expect(erro!.statusCode).toBe(422)
      const erros = erro!.data as { campo: string }[]
      expect(erros.map((e) => e.campo).sort()).toEqual([
        'dataSolicitacao',
        'descricao',
        'setor',
        'status',
        'titulo',
      ])
    })
  })

  describe('FR-005: data de solicitação', () => {
    it.each([
      ['formato inválido', '01-11-2026'],
      ['data inexistente (31/02/2026)', '31/02/2026'],
      ['data futura', '01/01/2027'],
    ])('recusa %s → 422', async (_caso, data) => {
      const erro = await postEsperandoErro({ ...dadosValidos, dataSolicitacao: data })

      expect(erro!.statusCode).toBe(422)
      const erros = erro!.data as { campo: string }[]
      expect(erros.some((e) => e.campo === 'dataSolicitacao')).toBe(true)
    })

    it('data de hoje é aceita', async () => {
      const hoje = new Date()
      const dia = String(hoje.getDate()).padStart(2, '0')
      const mes = String(hoje.getMonth() + 1).padStart(2, '0')
      const ano = hoje.getFullYear()
      const dataHoje = `${dia}/${mes}/${ano}`

      const resposta = await post({ ...dadosValidos, dataSolicitacao: dataHoje })

      expect(resposta).toMatchObject({ dataSolicitacao: `${ano}-${mes}-${dia}` })
    })
  })

  describe('FR-006: setor e status fora da lista', () => {
    it('setor inválido → 422', async () => {
      const erro = await postEsperandoErro({ ...dadosValidos, setor: 'SetorInexistente' })

      expect(erro!.statusCode).toBe(422)
      const erros = erro!.data as { campo: string }[]
      expect(erros.some((e) => e.campo === 'setor')).toBe(true)
    })

    it('status inválido → 422', async () => {
      const erro = await postEsperandoErro({ ...dadosValidos, status: 'Inexistente' })

      expect(erro!.statusCode).toBe(422)
      const erros = erro!.data as { campo: string }[]
      expect(erros.some((e) => e.campo === 'status')).toBe(true)
    })
  })

  describe('FR-007: limites de caracteres', () => {
    it('título com mais de 150 caracteres → 422, mensagem com o limite', async () => {
      const erro = await postEsperandoErro({
        ...dadosValidos,
        titulo: 'A'.repeat(151),
      })

      expect(erro!.statusCode).toBe(422)
      const erros = erro!.data as { mensagem: string }[]
      expect(erros.some((e) => /150/i.test(e.mensagem))).toBe(true)
    })

    it('descrição com mais de 2000 caracteres → 422, mensagem com o limite', async () => {
      const erro = await postEsperandoErro({
        ...dadosValidos,
        descricao: 'B'.repeat(2001),
      })

      expect(erro!.statusCode).toBe(422)
      const erros = erro!.data as { mensagem: string }[]
      expect(erros.some((e) => /2000/i.test(e.mensagem))).toBe(true)
    })
  })

  describe('FR-010 a FR-014: prioridade ignorada se enviada pelo cliente', () => {
    it('prioridade enviada pelo cliente é ignorada, calculada prevalece', async () => {
      const resposta = await post({
        ...dadosValidos,
        descricao: 'rotina normal de atendimento',
        prioridade: 'Alta', // tentativa de forçar — deve ser ignorada
      })

      expect(resposta.prioridade).toBe('Normal')
    })
  })

  describe('FR-008: id único', () => {
    it('duas demandas iguais → ambas aceitas, cada uma com id próprio', async () => {
      const primeira = await post(dadosValidos)
      const segunda = await post(dadosValidos)

      expect(primeira.id).toBeDefined()
      expect(segunda.id).toBeDefined()
      expect(segunda.id).not.toBe(primeira.id)
    })
  })

  describe('FR-011: conteúdo com marcação e caracteres especiais', () => {
    it('descrição com emojis, <b>, <script> é aceita e salva como está', async () => {
      const descricao =
        "Erro <b>critico</b>: &quot;relatorio&quot; falhou — 🚀 <script>alert(1)</script> linha '10'"
      const resposta = await post({ ...dadosValidos, descricao })

      expect(resposta.descricao).toBe(descricao)
      expect(resposta.descricao).toContain('<b>')
      expect(resposta.descricao).toContain('<script>')
    })
  })

  describe('Isolamento: cadastro recusado não grava (FR-003)', () => {
    it('depois de um cadastro recusado, GET confirma nada gravado', async () => {
      const erro = await postEsperandoErro({ ...dadosValidos, titulo: '' })
      expect(erro!.statusCode).toBe(422)

      const lista = await $fetch('/api/demandas')
      expect(Array.isArray(lista) && lista.length).toBe(0)
    })
  })
})
