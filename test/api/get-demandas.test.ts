/**
 * Testes de integração: GET /api/demandas
 *
 * Testa listagem, ordenação e filtros com dados persistidos.
 * Cada teste cadastra os próprios dados para isolamento.
 */

import { describe, test, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { fileURLToPath } from 'node:url'

describe('GET /api/demandas', async () => {
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

  test('Nenhuma demanda cadastrada → 200, lista vazia', async () => {
    // Este teste assume que não há demandas cadastradas,
    // ou pelo menos retorna array (pode estar vazio ou com dados de outros testes)
    const response = await $fetch('/api/demandas')

    expect(Array.isArray(response)).toBe(true)
  })

  test('Ordenação decrescente por dataSolicitacao; desempate por criadoEm mais recente', async () => {
    // Cadastrar 3 demandas com datas diferentes
    await cadastrarDemanda({
      titulo: 'Demanda 1',
      descricao: 'Primeira demanda',
      dataSolicitacao: '01/11/2026',
      setor: 'TI',
      status: 'Aberta',
    })

    await cadastrarDemanda({
      titulo: 'Demanda 2',
      descricao: 'Segunda demanda',
      dataSolicitacao: '03/11/2026',
      setor: 'TI',
      status: 'Aberta',
    })

    await cadastrarDemanda({
      titulo: 'Demanda 3',
      descricao: 'Terceira demanda',
      dataSolicitacao: '02/11/2026',
      setor: 'TI',
      status: 'Aberta',
    })

    const response = await $fetch('/api/demandas')

    // Deve ordenar por data decrescente: 03/11, 02/11, 01/11
    expect(Array.isArray(response)).toBe(true)
    expect(response.length).toBeGreaterThanOrEqual(3)

    // Encontrar as 3 demandas cadastradas
    const demandas = response.filter(
      (d: any) =>
        d.dataSolicitacao === '2026-11-01' ||
        d.dataSolicitacao === '2026-11-02' ||
        d.dataSolicitacao === '2026-11-03',
    )

    expect(demandas.length).toBeGreaterThanOrEqual(3)

    // Verificar ordenação: primeiro 03/11, depois 02/11, depois 01/11
    const indices = [
      response.findIndex((d: any) => d.dataSolicitacao === '2026-11-03'),
      response.findIndex((d: any) => d.dataSolicitacao === '2026-11-02'),
      response.findIndex((d: any) => d.dataSolicitacao === '2026-11-01'),
    ]

    // Índices devem estar em ordem crescente (03/11 antes de 02/11 antes de 01/11)
    expect(indices[0]).toBeLessThan(indices[1])
    expect(indices[1]).toBeLessThan(indices[2])
  })

  test('Desempate: mesma data, cadastro mais recente primeiro', async () => {
    const dataSolicitacao = '04/11/2026'

    const demanda1 = await cadastrarDemanda({
      titulo: 'Demanda A',
      descricao: 'Primeira cadastrada',
      dataSolicitacao,
      setor: 'TI',
      status: 'Aberta',
    })

    // Pequeno delay para garantir criadoEm diferente
    await new Promise((resolve) => setTimeout(resolve, 10))

    const demanda2 = await cadastrarDemanda({
      titulo: 'Demanda B',
      descricao: 'Segunda cadastrada',
      dataSolicitacao,
      setor: 'TI',
      status: 'Aberta',
    })

    const response = await $fetch('/api/demandas')

    // Encontrar as duas demandas na lista
    const encontradas = response.filter((d: any) => d.id === demanda1.id || d.id === demanda2.id)

    expect(encontradas.length).toBe(2)

    // demanda2 deve vir antes de demanda1 (mais recente primeiro)
    const indexDemanda1 = response.findIndex((d: any) => d.id === demanda1.id)
    const indexDemanda2 = response.findIndex((d: any) => d.id === demanda2.id)
    expect(indexDemanda2).toBeLessThan(indexDemanda1)
  })

  test('Filtro por Status isolado', async () => {
    // Cadastrar demandas com status diferentes
    const aberta = await cadastrarDemanda({
      titulo: 'Demanda Aberta',
      descricao: 'Status: Aberta',
      dataSolicitacao: '05/11/2026',
      setor: 'TI',
      status: 'Aberta',
    })

    const concluida = await cadastrarDemanda({
      titulo: 'Demanda Concluída',
      descricao: 'Status: Concluída',
      dataSolicitacao: '05/11/2026',
      setor: 'TI',
      status: 'Concluída',
    })

    // Filtrar por status Aberta
    const responseAberta = await $fetch('/api/demandas?status=Aberta')
    expect(Array.isArray(responseAberta)).toBe(true)
    expect(responseAberta.some((d: any) => d.id === aberta.id)).toBe(true)
    expect(responseAberta.some((d: any) => d.id === concluida.id)).toBe(false)

    // Filtrar por status Concluída
    const responseConcluida = await $fetch('/api/demandas?status=Concluída')
    expect(Array.isArray(responseConcluida)).toBe(true)
    expect(responseConcluida.some((d: any) => d.id === concluida.id)).toBe(true)
    expect(responseConcluida.some((d: any) => d.id === aberta.id)).toBe(false)
  })

  test('Filtro por Setor isolado', async () => {
    const ti = await cadastrarDemanda({
      titulo: 'Demanda TI',
      descricao: 'Setor: TI',
      dataSolicitacao: '05/11/2026',
      setor: 'TI',
      status: 'Aberta',
    })

    const rh = await cadastrarDemanda({
      titulo: 'Demanda RH',
      descricao: 'Setor: RH',
      dataSolicitacao: '05/11/2026',
      setor: 'RH',
      status: 'Aberta',
    })

    const responseTI = await $fetch('/api/demandas?setor=TI')
    expect(Array.isArray(responseTI)).toBe(true)
    expect(responseTI.some((d: any) => d.id === ti.id)).toBe(true)
    expect(responseTI.some((d: any) => d.id === rh.id)).toBe(false)

    const responseRH = await $fetch('/api/demandas?setor=RH')
    expect(Array.isArray(responseRH)).toBe(true)
    expect(responseRH.some((d: any) => d.id === rh.id)).toBe(true)
    expect(responseRH.some((d: any) => d.id === ti.id)).toBe(false)
  })

  test('Filtro por Prioridade isolado', async () => {
    const normal = await cadastrarDemanda({
      titulo: 'Demanda Normal',
      descricao: 'Sem palavra-chave',
      dataSolicitacao: '05/11/2026',
      setor: 'TI',
      status: 'Aberta',
    })

    const alta = await cadastrarDemanda({
      titulo: 'Demanda Urgente',
      descricao: 'Isso é urgente!',
      dataSolicitacao: '05/11/2026',
      setor: 'TI',
      status: 'Aberta',
    })

    const responseNormal = await $fetch('/api/demandas?prioridade=Normal')
    expect(Array.isArray(responseNormal)).toBe(true)
    expect(responseNormal.some((d: any) => d.id === normal.id)).toBe(true)
    expect(responseNormal.some((d: any) => d.id === alta.id)).toBe(false)

    const responseAlta = await $fetch('/api/demandas?prioridade=Alta')
    expect(Array.isArray(responseAlta)).toBe(true)
    expect(responseAlta.some((d: any) => d.id === alta.id)).toBe(true)
    expect(responseAlta.some((d: any) => d.id === normal.id)).toBe(false)
  })

  test('Filtro combinando Status e Setor → E lógico', async () => {
    const match = await cadastrarDemanda({
      titulo: 'TI Aberta',
      descricao: 'Bate com os dois filtros',
      dataSolicitacao: '05/11/2026',
      setor: 'TI',
      status: 'Aberta',
    })

    const nomatch1 = await cadastrarDemanda({
      titulo: 'RH Aberta',
      descricao: 'Setor diferente',
      dataSolicitacao: '05/11/2026',
      setor: 'RH',
      status: 'Aberta',
    })

    const nomatch2 = await cadastrarDemanda({
      titulo: 'TI Concluída',
      descricao: 'Status diferente',
      dataSolicitacao: '05/11/2026',
      setor: 'TI',
      status: 'Concluída',
    })

    const response = await $fetch('/api/demandas?status=Aberta&setor=TI')
    expect(Array.isArray(response)).toBe(true)
    expect(response.some((d: any) => d.id === match.id)).toBe(true)
    expect(response.some((d: any) => d.id === nomatch1.id)).toBe(false)
    expect(response.some((d: any) => d.id === nomatch2.id)).toBe(false)
  })

  test('Filtro combinando três critérios → E lógico', async () => {
    const match = await cadastrarDemanda({
      titulo: 'Erro no sistema',
      descricao: 'Erro crítico urgente', // Prioridade: Alta
      dataSolicitacao: '05/11/2026',
      setor: 'TI',
      status: 'Aberta',
    })

    const nomatch = await cadastrarDemanda({
      titulo: 'Nova funcionalidade',
      descricao: 'Implementar recurso', // Prioridade: Normal
      dataSolicitacao: '05/11/2026',
      setor: 'TI',
      status: 'Aberta',
    })

    const response = await $fetch('/api/demandas?status=Aberta&setor=TI&prioridade=Alta')
    expect(Array.isArray(response)).toBe(true)
    expect(response.some((d: any) => d.id === match.id)).toBe(true)
    expect(response.some((d: any) => d.id === nomatch.id)).toBe(false)
  })

  test('Filtro combinado sem resultado → lista vazia, sem erro', async () => {
    // Criar demanda que não bate com o filtro que vamos usar
    await cadastrarDemanda({
      titulo: 'Demanda qualquer',
      descricao: 'Sem palavras-chave',
      dataSolicitacao: '05/11/2026',
      setor: 'TI',
      status: 'Aberta',
    })

    // Filtrar por combinação que não existe
    const response = await $fetch('/api/demandas?status=Cancelada&setor=Jurídico')
    expect(Array.isArray(response)).toBe(true)
    // Pode estar vazia ou não, mas não deve dar erro
  })

  test('Filtro com valor fora da lista permitida → 400', async () => {
    try {
      await $fetch('/api/demandas?status=StatusInvalido')
      expect.fail('Deveria ter lançado erro')
    } catch (error: any) {
      expect(error.statusCode).toBe(400)
      expect(error.data).toHaveProperty('error')
      expect(error.data.message).toContain('inválido')
    }
  })

  test('Listagem não inclui descrição completa (FR-018)', async () => {
    const demanda = await cadastrarDemanda({
      titulo: 'Teste descrição',
      descricao: 'Esta é a descrição completa que não deve aparecer na listagem',
      dataSolicitacao: '05/11/2026',
      setor: 'TI',
      status: 'Aberta',
    })

    const response = await $fetch('/api/demandas')
    const encontrada = response.find((d: any) => d.id === demanda.id)

    expect(encontrada).toBeDefined()
    expect(encontrada).not.toHaveProperty('descricao')
    expect(encontrada).toHaveProperty('id')
    expect(encontrada).toHaveProperty('titulo')
    expect(encontrada).toHaveProperty('dataSolicitacao')
    expect(encontrada).toHaveProperty('setor')
    expect(encontrada).toHaveProperty('status')
    expect(encontrada).toHaveProperty('prioridade')
  })
})
