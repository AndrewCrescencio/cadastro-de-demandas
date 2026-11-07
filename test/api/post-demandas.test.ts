/**
 * Testes de integração: POST /api/demandas
 *
 * Confirma que a rota, validação e persistência estão corretamente conectadas.
 * A lógica pura já está coberta em testes unitários — aqui testamos o encanamento HTTP.
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { fileURLToPath } from 'node:url'
import { limparBanco } from '../setup/db-cleanup'

describe('POST /api/demandas', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
  })

  // Limpa o banco antes de cada teste para garantir isolamento
  beforeEach(async () => {
    await limparBanco()
  })

  // Dados base válidos para testes
  const dadosValidos = {
    titulo: 'Relatório mensal',
    descricao: 'Criar relatório de vendas',
    dataSolicitacao: '05/11/2026',
    setor: 'Comercial',
    status: 'Aberta',
  }

  test('Cadastro válido sem palavra-chave → 201, prioridade Normal', async () => {
    const dados = { ...dadosValidos }

    const response = await $fetch('/api/demandas', {
      method: 'POST',
      body: dados,
    })

    expect(response).toHaveProperty('id')
    expect(typeof response.id).toBe('number')
    expect(response.id).toBeGreaterThan(0)
    expect(response.prioridade).toBe('Normal')
    expect(response.titulo).toBe(dados.titulo)
    expect(response.descricao).toBe(dados.descricao)
    expect(response).toHaveProperty('criadoEm')
  })

  test('Cadastro com "urgente" → 201, prioridade Alta', async () => {
    const dados = {
      ...dadosValidos,
      titulo: 'Acesso ao sistema',
      descricao: 'Preciso do acesso liberado, é urgente',
    }

    const response = await $fetch('/api/demandas', {
      method: 'POST',
      body: dados,
    })

    expect(response.prioridade).toBe('Alta')
    expect(response.id).toBeGreaterThan(0)
  })

  test('Cadastro com "erro" → 201, prioridade Alta', async () => {
    const dados = {
      ...dadosValidos,
      titulo: 'Relatório mensal',
      descricao: 'Erro ao gerar o relatório mensal',
    }

    const response = await $fetch('/api/demandas', {
      method: 'POST',
      body: dados,
    })

    expect(response.prioridade).toBe('Alta')
    expect(response.id).toBeGreaterThan(0)
  })

  test('Título vazio → 422 com mensagem do campo', async () => {
    const dados = { ...dadosValidos, titulo: '' }

    try {
      await $fetch('/api/demandas', {
        method: 'POST',
        body: dados,
      })
      expect.fail('Deveria ter lançado erro')
    } catch (error: any) {
      expect(error.statusCode).toBe(422)
      expect(Array.isArray(error.data)).toBe(true)
      expect(error.data.some((e: any) => e.campo === 'titulo')).toBe(true)
      expect(
        error.data.some((e: any) => e.campo === 'titulo' && e.mensagem.includes('obrigatório')),
      ).toBe(true)
    }
  })

  test('Descrição vazia → 422 com mensagem do campo', async () => {
    const dados = { ...dadosValidos, descricao: '' }

    try {
      await $fetch('/api/demandas', {
        method: 'POST',
        body: dados,
      })
      expect.fail('Deveria ter lançado erro')
    } catch (error: any) {
      expect(error.statusCode).toBe(422)
      expect(Array.isArray(error.data)).toBe(true)
      expect(error.data.some((e: any) => e.campo === 'descricao')).toBe(true)
    }
  })

  test('Vários campos vazios → resposta lista TODOS os erros', async () => {
    const dados = {
      titulo: '',
      descricao: '',
      dataSolicitacao: '',
      setor: '',
      status: '',
    }

    try {
      await $fetch('/api/demandas', {
        method: 'POST',
        body: dados,
      })
      expect.fail('Deveria ter lançado erro')
    } catch (error: any) {
      expect(error.statusCode).toBe(422)
      expect(Array.isArray(error.data)).toBe(true)
      expect(error.data.length).toBeGreaterThanOrEqual(5)

      // Confirma que há erro para cada campo
      const campos = error.data.map((e: any) => e.campo)
      expect(campos).toContain('titulo')
      expect(campos).toContain('descricao')
      expect(campos).toContain('dataSolicitacao')
      expect(campos).toContain('setor')
      expect(campos).toContain('status')
    }
  })

  test('Data futura → 422', async () => {
    const dados = {
      ...dadosValidos,
      dataSolicitacao: '01/01/2028', // Data no futuro
    }

    try {
      await $fetch('/api/demandas', {
        method: 'POST',
        body: dados,
      })
      expect.fail('Deveria ter lançado erro')
    } catch (error: any) {
      expect(error.statusCode).toBe(422)
      expect(Array.isArray(error.data)).toBe(true)
      expect(error.data.some((e: any) => e.campo === 'dataSolicitacao')).toBe(true)
      expect(
        error.data.some((e: any) => e.campo === 'dataSolicitacao' && e.mensagem.includes('futura')),
      ).toBe(true)
    }
  })

  test('Data inexistente → 422', async () => {
    const dados = {
      ...dadosValidos,
      dataSolicitacao: '31/02/2026',
    }

    try {
      await $fetch('/api/demandas', {
        method: 'POST',
        body: dados,
      })
      expect.fail('Deveria ter lançado erro')
    } catch (error: any) {
      expect(error.statusCode).toBe(422)
      expect(Array.isArray(error.data)).toBe(true)
      expect(error.data.some((e: any) => e.campo === 'dataSolicitacao')).toBe(true)
    }
  })

  test('Enviar "prioridade" manualmente → ignorado, usa a calculada', async () => {
    const dados = {
      ...dadosValidos,
      descricao: 'Erro ao gerar o relatório mensal', // Contém "erro" → Alta
      prioridade: 'Normal', // Cliente tenta enviar "Normal"
    }

    const response = await $fetch('/api/demandas', {
      method: 'POST',
      body: dados,
    })

    // Deve usar a prioridade calculada (Alta), não a enviada (Normal)
    expect(response.prioridade).toBe('Alta')
  })

  test('Resposta 201 inclui id único, prioridade atribuída e criadoEm', async () => {
    const dados = { ...dadosValidos }

    const response = await $fetch('/api/demandas', {
      method: 'POST',
      body: dados,
    })

    expect(response).toHaveProperty('id')
    expect(typeof response.id).toBe('number')
    expect(response.id).toBeGreaterThan(0)

    expect(response).toHaveProperty('prioridade')
    expect(['Normal', 'Alta']).toContain(response.prioridade)

    expect(response).toHaveProperty('criadoEm')
    expect(typeof response.criadoEm).toBe('string')
    expect(new Date(response.criadoEm).getTime()).not.toBeNaN()
  })

  test('Duas demandas idênticas → ambas aceitas, ids diferentes', async () => {
    const dados = { ...dadosValidos }

    const response1 = await $fetch('/api/demandas', {
      method: 'POST',
      body: dados,
    })

    const response2 = await $fetch('/api/demandas', {
      method: 'POST',
      body: dados,
    })

    expect(response1.id).not.toBe(response2.id)
    expect(response1.titulo).toBe(response2.titulo)
    expect(response1.descricao).toBe(response2.descricao)
  })

  test('Descrição com caracteres especiais/marcação → aceito e salvo', async () => {
    const dados = {
      ...dadosValidos,
      titulo: 'Teste de segurança',
      descricao: '<script>alert("XSS")</script> & "quotes" e acentuação: çãõ',
    }

    const response = await $fetch('/api/demandas', {
      method: 'POST',
      body: dados,
    })

    expect(response.descricao).toBe(dados.descricao)
    expect(response.id).toBeGreaterThan(0)
  })

  test('Depois de cadastro recusado, confirmar via GET que nada foi gravado', async () => {
    const dadosInvalidos = {
      titulo: '', // Inválido
      descricao: 'Descrição válida',
      dataSolicitacao: '05/11/2026',
      setor: 'TI',
      status: 'Aberta',
    }

    // Obter lista antes
    const listaBefore = await $fetch('/api/demandas')
    const countBefore = Array.isArray(listaBefore) ? listaBefore.length : 0

    // Tentar cadastrar com dados inválidos
    try {
      await $fetch('/api/demandas', {
        method: 'POST',
        body: dadosInvalidos,
      })
      expect.fail('Deveria ter lançado erro')
    } catch (error: any) {
      expect(error.statusCode).toBe(422)
    }

    // Confirmar que a lista não mudou
    const listaAfter = await $fetch('/api/demandas')
    const countAfter = Array.isArray(listaAfter) ? listaAfter.length : 0

    expect(countAfter).toBe(countBefore)
  })
})
