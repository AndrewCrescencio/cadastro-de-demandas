/**
 * Testes de validação de demandas.
 *
 * SC-002: 100% das validações funcionam corretamente
 * História 2: Impedir cadastro incompleto ou inválido
 */

import { describe, it, expect } from 'vitest'
import {
  validarCriacaoDemanda,
  parseDataBrasileira,
  converterParaISO,
  formatarDataBrasileira,
} from '~/server/utils/demandas/validacao'

describe('Validação de Criação de Demanda', () => {
  const dadosValidos = {
    titulo: 'Relatório de vendas',
    descricao: 'Criar relatório de vendas por região',
    dataSolicitacao: '01/11/2026',
    setor: 'Comercial',
    status: 'Aberta',
  }

  describe('Casos válidos', () => {
    it('aceita demanda com todos os campos válidos', () => {
      const resultado = validarCriacaoDemanda(dadosValidos)
      expect(resultado.success).toBe(true)
    })

    it('aceita data de hoje', () => {
      const hoje = new Date()
      const dataFormatada = formatarDataBrasileira(hoje)

      const resultado = validarCriacaoDemanda({
        ...dadosValidos,
        dataSolicitacao: dataFormatada,
      })

      expect(resultado.success).toBe(true)
    })

    it('remove espaços do início e fim (trim)', () => {
      const resultado = validarCriacaoDemanda({
        ...dadosValidos,
        titulo: '  Título com espaços  ',
        descricao: '  Descrição com espaços  ',
      })

      expect(resultado.success).toBe(true)
      if (resultado.success) {
        expect(resultado.data.titulo).toBe('Título com espaços')
        expect(resultado.data.descricao).toBe('Descrição com espaços')
      }
    })
  })

  describe('FR-003: Campos obrigatórios', () => {
    it('rejeita quando título está vazio', () => {
      const resultado = validarCriacaoDemanda({
        ...dadosValidos,
        titulo: '',
      })

      expect(resultado.success).toBe(false)
      if (!resultado.success) {
        expect(
          resultado.error.errors.some(
            (e) => e.path.includes('titulo') && e.message.includes('obrigatório'),
          ),
        ).toBe(true)
      }
    })

    it('rejeita quando descrição está vazia', () => {
      const resultado = validarCriacaoDemanda({
        ...dadosValidos,
        descricao: '',
      })

      expect(resultado.success).toBe(false)
      if (!resultado.success) {
        expect(resultado.error.errors.some((e) => e.path.includes('descricao'))).toBe(true)
      }
    })

    it('rejeita quando título é apenas espaços', () => {
      const resultado = validarCriacaoDemanda({
        ...dadosValidos,
        titulo: '   ',
      })

      expect(resultado.success).toBe(false)
    })

    it('rejeita quando campos estão ausentes', () => {
      const resultado = validarCriacaoDemanda({
        titulo: 'Apenas título',
      })

      expect(resultado.success).toBe(false)
      if (!resultado.success) {
        // Deve listar múltiplos campos de uma vez (História 2, cenário 2)
        expect(resultado.error.errors.length).toBeGreaterThan(1)
      }
    })
  })

  describe('FR-005: Validação de data', () => {
    it('rejeita data futura', () => {
      const resultado = validarCriacaoDemanda({
        ...dadosValidos,
        dataSolicitacao: '01/01/2027',
      })

      expect(resultado.success).toBe(false)
      if (!resultado.success) {
        expect(resultado.error.errors.some((e) => e.message.includes('futura'))).toBe(true)
      }
    })

    it('rejeita data inválida: 31/02/2026', () => {
      const resultado = validarCriacaoDemanda({
        ...dadosValidos,
        dataSolicitacao: '31/02/2026',
      })

      expect(resultado.success).toBe(false)
    })

    it('rejeita formato inválido: 2026-11-01', () => {
      const resultado = validarCriacaoDemanda({
        ...dadosValidos,
        dataSolicitacao: '2026-11-01',
      })

      expect(resultado.success).toBe(false)
    })

    it('rejeita data parcial: 01/11', () => {
      const resultado = validarCriacaoDemanda({
        ...dadosValidos,
        dataSolicitacao: '01/11',
      })

      expect(resultado.success).toBe(false)
    })
  })

  describe('FR-006: Listas fechadas', () => {
    it('rejeita setor inválido', () => {
      const resultado = validarCriacaoDemanda({
        ...dadosValidos,
        setor: 'SetorInexistente',
      })

      expect(resultado.success).toBe(false)
    })

    it('rejeita status inválido', () => {
      const resultado = validarCriacaoDemanda({
        ...dadosValidos,
        status: 'StatusInexistente',
      })

      expect(resultado.success).toBe(false)
    })

    it('aceita todos os setores válidos', () => {
      const setores = [
        'Administrativo',
        'Comercial',
        'Financeiro',
        'Jurídico',
        'Operações',
        'RH',
        'TI',
        'Outros',
      ]

      setores.forEach((setor) => {
        const resultado = validarCriacaoDemanda({
          ...dadosValidos,
          setor,
        })
        expect(resultado.success).toBe(true)
      })
    })

    it('aceita todos os status válidos', () => {
      const statusList = ['Aberta', 'Em andamento', 'Concluída', 'Cancelada']

      statusList.forEach((status) => {
        const resultado = validarCriacaoDemanda({
          ...dadosValidos,
          status,
        })
        expect(resultado.success).toBe(true)
      })
    })
  })

  describe('FR-007: Limites de caracteres', () => {
    it('rejeita título com mais de 150 caracteres', () => {
      const resultado = validarCriacaoDemanda({
        ...dadosValidos,
        titulo: 'A'.repeat(151),
      })

      expect(resultado.success).toBe(false)
      if (!resultado.success) {
        expect(resultado.error.errors.some((e) => e.message.includes('150'))).toBe(true)
      }
    })

    it('aceita título com exatamente 150 caracteres', () => {
      const resultado = validarCriacaoDemanda({
        ...dadosValidos,
        titulo: 'A'.repeat(150),
      })

      expect(resultado.success).toBe(true)
    })

    it('rejeita descrição com mais de 2000 caracteres', () => {
      const resultado = validarCriacaoDemanda({
        ...dadosValidos,
        descricao: 'B'.repeat(2001),
      })

      expect(resultado.success).toBe(false)
      if (!resultado.success) {
        expect(resultado.error.errors.some((e) => e.message.includes('2000'))).toBe(true)
      }
    })

    it('aceita descrição com exatamente 2000 caracteres', () => {
      const resultado = validarCriacaoDemanda({
        ...dadosValidos,
        descricao: 'B'.repeat(2000),
      })

      expect(resultado.success).toBe(true)
    })
  })

  describe('FR-014: Prioridade não aceita do usuário', () => {
    it('ignora campo prioridade no payload (strict mode)', () => {
      const resultado = validarCriacaoDemanda({
        ...dadosValidos,
        prioridade: 'Alta', // Tentando forçar prioridade
      })

      // Com strict(), campos extras são rejeitados
      expect(resultado.success).toBe(false)
    })
  })
})

describe('Funções de Data', () => {
  describe('parseDataBrasileira', () => {
    it('converte data válida DD/MM/AAAA', () => {
      const data = parseDataBrasileira('15/03/2026')
      expect(data).toBeInstanceOf(Date)
      expect(data?.getDate()).toBe(15)
      expect(data?.getMonth()).toBe(2) // Março = 2 (zero-indexed)
      expect(data?.getFullYear()).toBe(2026)
    })

    it('retorna null para data inválida', () => {
      expect(parseDataBrasileira('31/02/2026')).toBeNull()
      expect(parseDataBrasileira('99/99/9999')).toBeNull()
      expect(parseDataBrasileira('2026-03-15')).toBeNull()
      expect(parseDataBrasileira('15/03')).toBeNull()
    })
  })

  describe('converterParaISO', () => {
    it('converte DD/MM/AAAA para YYYY-MM-DD', () => {
      expect(converterParaISO('15/03/2026')).toBe('2026-03-15')
      expect(converterParaISO('01/01/2026')).toBe('2026-01-01')
    })

    it('retorna null para data inválida', () => {
      expect(converterParaISO('31/02/2026')).toBeNull()
      expect(converterParaISO('invalid')).toBeNull()
    })
  })

  describe('formatarDataBrasileira', () => {
    it('formata Date para DD/MM/AAAA', () => {
      const data = new Date(2026, 2, 15) // 15 de março de 2026
      expect(formatarDataBrasileira(data)).toBe('15/03/2026')
    })

    it('adiciona zero à esquerda quando necessário', () => {
      const data = new Date(2026, 0, 5) // 5 de janeiro
      expect(formatarDataBrasileira(data)).toBe('05/01/2026')
    })
  })
})
