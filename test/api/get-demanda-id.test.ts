/**
 * Testes de integração: GET /api/demandas/:id
 *
 * Testa detalhamento de demanda individual com dados persistidos.
 */

import { describe, test, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { fileURLToPath } from 'node:url'

describe('GET /api/demandas/:id', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
  })

  // Helper para cadastrar uma demanda
  async function cadastrarDemanda(dados: any) {
    return await $fetch('/api/demandas', {
      method: 'POST',
      body: dados,
    })
  }

  test('Id existente → 200 com todos os campos, incluindo descrição completa', async () => {
    const demanda = await cadastrarDemanda({
      titulo: 'Demanda completa',
      descricao: 'Esta é a descrição completa que deve aparecer no detalhe',
      dataSolicitacao: '05/11/2026',
      setor: 'TI',
      status: 'Aberta',
    })

    const response = await $fetch(`/api/demandas/${demanda.id}`)

    expect(response).toHaveProperty('id', demanda.id)
    expect(response).toHaveProperty('titulo', demanda.titulo)
    expect(response).toHaveProperty('descricao', demanda.descricao)
    expect(response).toHaveProperty('dataSolicitacao', demanda.dataSolicitacao)
    expect(response).toHaveProperty('setor', demanda.setor)
    expect(response).toHaveProperty('status', demanda.status)
    expect(response).toHaveProperty('prioridade', demanda.prioridade)
    expect(response).toHaveProperty('criadoEm')
  })

  test('Id inexistente → 404', async () => {
    const idInexistente = 99999999

    try {
      await $fetch(`/api/demandas/${idInexistente}`)
      expect.fail('Deveria ter lançado erro')
    } catch (error: any) {
      expect(error.statusCode).toBe(404)
      expect(error.data).toHaveProperty('error', 'not_found')
      expect(error.data).toHaveProperty('message')
      expect(error.data.message).toContain(String(idInexistente))
    }
  })

  test('Id em formato inválido (não numérico) → 404, sem erro 500', async () => {
    try {
      await $fetch('/api/demandas/abc')
      expect.fail('Deveria ter lançado erro')
    } catch (error: any) {
      expect(error.statusCode).toBe(404)
      expect(error.data).toHaveProperty('error', 'not_found')
      expect(error.data).toHaveProperty('message')
    }
  })

  test('Id zero → 404', async () => {
    try {
      await $fetch('/api/demandas/0')
      expect.fail('Deveria ter lançado erro')
    } catch (error: any) {
      expect(error.statusCode).toBe(404)
      expect(error.data).toHaveProperty('error', 'not_found')
    }
  })

  test('Id negativo → 404', async () => {
    try {
      await $fetch('/api/demandas/-1')
      expect.fail('Deveria ter lançado erro')
    } catch (error: any) {
      expect(error.statusCode).toBe(404)
      expect(error.data).toHaveProperty('error', 'not_found')
    }
  })

  test('Id com formato não canônico (ex: "05") → 404', async () => {
    try {
      await $fetch('/api/demandas/05')
      expect.fail('Deveria ter lançado erro')
    } catch (error: any) {
      expect(error.statusCode).toBe(404)
      expect(error.data).toHaveProperty('error', 'not_found')
    }
  })

  test('Conteúdo com marcação/caracteres especiais volta exatamente como salvo', async () => {
    const descricaoComMarcacao = '<script>alert("XSS")</script> & "quotes" e acentuação: çãõ'
    const tituloComCaracteres = 'Título com & < > " \' caracteres'

    const demanda = await cadastrarDemanda({
      titulo: tituloComCaracteres,
      descricao: descricaoComMarcacao,
      dataSolicitacao: '05/11/2026',
      setor: 'TI',
      status: 'Aberta',
    })

    const response = await $fetch(`/api/demandas/${demanda.id}`)

    // Deve voltar exatamente como foi salvo (round-trip via banco)
    expect(response.titulo).toBe(tituloComCaracteres)
    expect(response.descricao).toBe(descricaoComMarcacao)
  })

  test('Caracteres especiais diversos: emojis, unicode, quebras de linha', async () => {
    const descricaoEspecial = `Texto com emoji 😀 e unicode ñ ü ć
Quebra de linha
	Tab aqui
E mais "aspas" e 'apóstrofos'`

    const demanda = await cadastrarDemanda({
      titulo: 'Teste unicode',
      descricao: descricaoEspecial,
      dataSolicitacao: '05/11/2026',
      setor: 'TI',
      status: 'Aberta',
    })

    const response = await $fetch(`/api/demandas/${demanda.id}`)

    expect(response.descricao).toBe(descricaoEspecial)
  })

  test('Detalhe inclui descrição completa (diferente da listagem)', async () => {
    const descricaoLonga = 'A'.repeat(500)

    const demanda = await cadastrarDemanda({
      titulo: 'Teste descrição longa',
      descricao: descricaoLonga,
      dataSolicitacao: '05/11/2026',
      setor: 'TI',
      status: 'Aberta',
    })

    // Na listagem não deve ter descrição
    const listagem = await $fetch('/api/demandas')
    const naListagem = listagem.find((d: any) => d.id === demanda.id)
    expect(naListagem).not.toHaveProperty('descricao')

    // No detalhe deve ter descrição completa
    const detalhe = await $fetch(`/api/demandas/${demanda.id}`)
    expect(detalhe).toHaveProperty('descricao', descricaoLonga)
  })
})
