/**
 * Testes da regra de prioridade automática.
 *
 * SC-003: 100% dos exemplos do Anexo A produzem a prioridade esperada
 * RNF-002: Verificação repetível e automatizada
 *
 * Cada teste corresponde a um exemplo do Anexo A da especificação.
 */

import { describe, it, expect } from 'vitest'
import { calcularPrioridade } from '../../server/utils/demandas/prioridade'

describe('Regra de Prioridade Automática - Anexo A', () => {
  describe('Exemplos que devem resultar em Alta', () => {
    it('#1: contém "erro"', () => {
      const descricao = 'Erro ao gerar o relatório mensal'
      expect(calcularPrioridade(descricao)).toBe('Alta')
    })

    it('#2: contém "urgente"', () => {
      const descricao = 'Preciso do acesso liberado, é urgente'
      expect(calcularPrioridade(descricao)).toBe('Alta')
    })

    it('#3: ignora maiúsculas/minúsculas - "URGENTE"', () => {
      const descricao = 'URGENTE: contrato precisa de assinatura hoje'
      expect(calcularPrioridade(descricao)).toBe('Alta')
    })

    it('#4: plural aceito - "erros"', () => {
      const descricao = 'Corrigir erros na planilha de custos'
      expect(calcularPrioridade(descricao)).toBe('Alta')
    })

    it('#5: hífen e dois-pontos delimitam palavra - "erro-01"', () => {
      const descricao = 'Valor divergente: erro-01 no cálculo da fatura'
      expect(calcularPrioridade(descricao)).toBe('Alta')
    })

    it('#6: negação não é interpretada - "Não é urgente"', () => {
      const descricao = 'Não é urgente, mas gostaria de um novo modelo de relatório'
      expect(calcularPrioridade(descricao)).toBe('Alta')
    })

    it('#12: descrição composta só pela palavra-chave - "erro"', () => {
      const descricao = 'erro'
      expect(calcularPrioridade(descricao)).toBe('Alta')
    })
  })

  describe('Exemplos que devem resultar em Normal', () => {
    it('#7: sem palavras-chave', () => {
      const descricao = 'Criar relatório de vendas por região'
      expect(calcularPrioridade(descricao)).toBe('Normal')
    })

    it('#8: "erro" só aparece dentro de "interrompe"', () => {
      const descricao = 'Ajustar a rotina que interrompe o envio das notas'
      expect(calcularPrioridade(descricao)).toBe('Normal')
    })

    it('#9: "erro" só aparece dentro de "terror"', () => {
      const descricao = 'O terror dos prazos precisa ser discutido'
      expect(calcularPrioridade(descricao)).toBe('Normal')
    })

    it('#10: palavra-chave só no título, não na descrição', () => {
      // FR-013: Só a descrição é avaliada
      const descricao = 'Criar relatório de vendas'
      expect(calcularPrioridade(descricao)).toBe('Normal')
    })

    it('#11: "urgentemente" não é palavra-chave (P-4)', () => {
      const descricao = 'Precisamos disso urgentemente'
      expect(calcularPrioridade(descricao)).toBe('Normal')
    })
  })

  describe('Casos de borda adicionais', () => {
    it('descrição vazia retorna Normal', () => {
      expect(calcularPrioridade('')).toBe('Normal')
    })

    it('descrição null/undefined retorna Normal', () => {
      expect(calcularPrioridade(null as any)).toBe('Normal')
      expect(calcularPrioridade(undefined as any)).toBe('Normal')
    })

    it('palavra-chave com parênteses: "(urgente)"', () => {
      const descricao = 'Problema (urgente) no servidor'
      expect(calcularPrioridade(descricao)).toBe('Alta')
    })

    it('palavra-chave com pontuação: "erro."', () => {
      const descricao = 'Ocorreu um erro.'
      expect(calcularPrioridade(descricao)).toBe('Alta')
    })

    it('palavra-chave no início: "Erro crítico"', () => {
      const descricao = 'Erro crítico no sistema'
      expect(calcularPrioridade(descricao)).toBe('Alta')
    })

    it('palavra-chave no final: "Relatório com erro"', () => {
      const descricao = 'Relatório com erro'
      expect(calcularPrioridade(descricao)).toBe('Alta')
    })

    it('múltiplas palavras-chave: "urgente" e "erro"', () => {
      const descricao = 'Urgente: corrigir erro no sistema'
      expect(calcularPrioridade(descricao)).toBe('Alta')
    })

    it('palavra-chave com acentos próximos: "Érro" não é "erro"', () => {
      const descricao = 'Érro na planilha'
      expect(calcularPrioridade(descricao)).toBe('Normal')
    })

    it('plural com "s": "urgentes"', () => {
      const descricao = 'Temos questões urgentes para resolver'
      expect(calcularPrioridade(descricao)).toBe('Alta')
    })
  })

  describe('Variações que NÃO devem ativar a regra (P-4)', () => {
    it('"urgência" não é palavra-chave', () => {
      const descricao = 'Com urgência, precisamos do relatório'
      expect(calcularPrioridade(descricao)).toBe('Normal')
    })

    it('"urgentíssimo" não é palavra-chave', () => {
      const descricao = 'Isso é urgentíssimo'
      expect(calcularPrioridade(descricao)).toBe('Normal')
    })

    it('"errado" não é palavra-chave', () => {
      const descricao = 'O valor está errado'
      expect(calcularPrioridade(descricao)).toBe('Normal')
    })

    it('"errar" não é palavra-chave', () => {
      const descricao = 'Não podemos errar neste processo'
      expect(calcularPrioridade(descricao)).toBe('Normal')
    })
  })
})
