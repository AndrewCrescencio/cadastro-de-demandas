/**
 * Testes unitários para lógica pura de demandas.
 * Sem HTTP, sem servidor Nuxt, sem banco — apenas chamadas diretas às funções.
 *
 * Cobertura:
 * - calcularPrioridade: 12 exemplos do Anexo A + casos extras
 * - parseDataBrasileira / formatarDataBrasileira / converterParaISO: formatos e validações
 * - hojeISO: fuso horário America/Sao_Paulo
 * - validarCriacaoDemanda / prepararDemanda: validações de campos e prioridade calculada
 */

import { describe, test, expect } from 'vitest'
import { calcularPrioridade } from '../../server/utils/demandas/prioridade'
import { parseDataBrasileira, formatarDataBrasileira, hojeISO } from '../../shared/utils/data'
import {
  converterParaISO,
  validarCriacaoDemanda,
  prepararDemanda,
  formatarErrosValidacao,
} from '../../server/utils/demandas/validacao'

// ============================================================================
// calcularPrioridade - 12 exemplos do Anexo A + casos extras
// ============================================================================

describe('calcularPrioridade - Anexo A', () => {
  test('Exemplo 1: "Erro ao gerar o relatório mensal" → Alta', () => {
    expect(calcularPrioridade('Erro ao gerar o relatório mensal')).toBe('Alta')
  })

  test('Exemplo 2: "Preciso do acesso liberado, é urgente" → Alta', () => {
    expect(calcularPrioridade('Preciso do acesso liberado, é urgente')).toBe('Alta')
  })

  test('Exemplo 3: "URGENTE: contrato precisa de assinatura hoje" → Alta (ignora maiúsculas)', () => {
    expect(calcularPrioridade('URGENTE: contrato precisa de assinatura hoje')).toBe('Alta')
  })

  test('Exemplo 4: "Corrigir erros na planilha de custos" → Alta (plural)', () => {
    expect(calcularPrioridade('Corrigir erros na planilha de custos')).toBe('Alta')
  })

  test('Exemplo 5: "Valor divergente: erro-01 no cálculo da fatura" → Alta (com pontuação)', () => {
    expect(calcularPrioridade('Valor divergente: erro-01 no cálculo da fatura')).toBe('Alta')
  })

  test('Exemplo 6: "Não é urgente, mas gostaria de um novo modelo de relatório" → Alta (negação não é interpretada)', () => {
    expect(calcularPrioridade('Não é urgente, mas gostaria de um novo modelo de relatório')).toBe(
      'Alta',
    )
  })

  test('Exemplo 7: "Criar relatório de vendas por região" → Normal', () => {
    expect(calcularPrioridade('Criar relatório de vendas por região')).toBe('Normal')
  })

  test('Exemplo 8: "Ajustar a rotina que interrompe o envio das notas" → Normal ("erro" dentro de "interrompe")', () => {
    expect(calcularPrioridade('Ajustar a rotina que interrompe o envio das notas')).toBe('Normal')
  })

  test('Exemplo 9: "O terror dos prazos precisa ser discutido" → Normal ("erro" dentro de "terror")', () => {
    expect(calcularPrioridade('O terror dos prazos precisa ser discutido')).toBe('Normal')
  })

  test('Exemplo 10: Título "Urgente: novo relatório" mas descrição "Criar relatório de vendas" → Normal', () => {
    // A função calcularPrioridade só recebe a descrição, não o título
    expect(calcularPrioridade('Criar relatório de vendas')).toBe('Normal')
  })

  test('Exemplo 11: "Precisamos disso urgentemente" → Normal ("urgentemente" não é palavra-chave)', () => {
    expect(calcularPrioridade('Precisamos disso urgentemente')).toBe('Normal')
  })

  test('Exemplo 12: Plural "urgentes" → Alta', () => {
    expect(calcularPrioridade('Temos casos urgentes para resolver')).toBe('Alta')
  })
})

describe('calcularPrioridade - Casos extras', () => {
  test('"urgência" isoladamente → Normal (não é palavra-chave)', () => {
    expect(calcularPrioridade('A urgência do projeto é média')).toBe('Normal')
  })

  test('"urgentemente" isoladamente → Normal (não é palavra-chave)', () => {
    expect(calcularPrioridade('Precisamos urgentemente de aprovação')).toBe('Normal')
  })

  test('Descrição vazia → Normal', () => {
    expect(calcularPrioridade('')).toBe('Normal')
  })

  test('Descrição só com espaços → Normal', () => {
    expect(calcularPrioridade('   ')).toBe('Normal')
  })
})

// ============================================================================
// parseDataBrasileira / formatarDataBrasileira / converterParaISO
// ============================================================================

describe('parseDataBrasileira', () => {
  test('Data válida comum: "05/11/2026" → Date correto', () => {
    const data = parseDataBrasileira('05/11/2026')
    expect(data).not.toBeNull()
    expect(data?.getDate()).toBe(5)
    expect(data?.getMonth()).toBe(10) // Janeiro = 0
    expect(data?.getFullYear()).toBe(2026)
  })

  test('Formato ISO "2026-11-05" → null', () => {
    expect(parseDataBrasileira('2026-11-05')).toBeNull()
  })

  test('Formato "11/05/2026" → válido (dia 11, mês 05)', () => {
    // "11/05/2026" é válido como DD/MM/AAAA (11 de maio de 2026)
    const data = parseDataBrasileira('11/05/2026')
    expect(data).not.toBeNull()
    expect(data?.getDate()).toBe(11)
    expect(data?.getMonth()).toBe(4) // Maio = 4
    expect(data?.getFullYear()).toBe(2026)
  })

  test('Texto qualquer "hoje" → null', () => {
    expect(parseDataBrasileira('hoje')).toBeNull()
  })

  test('Data inexistente: "31/02/2026" → null', () => {
    expect(parseDataBrasileira('31/02/2026')).toBeNull()
  })

  test('Data inexistente: "31/04/2026" → null', () => {
    expect(parseDataBrasileira('31/04/2026')).toBeNull()
  })

  test('Data inexistente: "29/02/2026" (ano não bissexto) → null', () => {
    expect(parseDataBrasileira('29/02/2026')).toBeNull()
  })

  test('Data válida: "29/02/2028" (ano bissexto) → Date correto', () => {
    const data = parseDataBrasileira('29/02/2028')
    expect(data).not.toBeNull()
    expect(data?.getDate()).toBe(29)
    expect(data?.getMonth()).toBe(1) // Fevereiro
    expect(data?.getFullYear()).toBe(2028)
  })

  test('Data de borda: "01/01/2026" → Date correto', () => {
    const data = parseDataBrasileira('01/01/2026')
    expect(data).not.toBeNull()
    expect(data?.getDate()).toBe(1)
    expect(data?.getMonth()).toBe(0)
    expect(data?.getFullYear()).toBe(2026)
  })

  test('Data de borda: "31/12/2026" → Date correto', () => {
    const data = parseDataBrasileira('31/12/2026')
    expect(data).not.toBeNull()
    expect(data?.getDate()).toBe(31)
    expect(data?.getMonth()).toBe(11)
    expect(data?.getFullYear()).toBe(2026)
  })
})

describe('formatarDataBrasileira', () => {
  test('Date(2026, 10, 5) → "05/11/2026"', () => {
    const data = new Date(2026, 10, 5) // Mês 10 = novembro
    expect(formatarDataBrasileira(data)).toBe('05/11/2026')
  })

  test('Date(2028, 1, 29) → "29/02/2028"', () => {
    const data = new Date(2028, 1, 29)
    expect(formatarDataBrasileira(data)).toBe('29/02/2028')
  })

  test('Date(2026, 0, 1) → "01/01/2026"', () => {
    const data = new Date(2026, 0, 1)
    expect(formatarDataBrasileira(data)).toBe('01/01/2026')
  })

  test('Date(2026, 11, 31) → "31/12/2026"', () => {
    const data = new Date(2026, 11, 31)
    expect(formatarDataBrasileira(data)).toBe('31/12/2026')
  })
})

describe('parseDataBrasileira + formatarDataBrasileira (ida e volta)', () => {
  test('"05/11/2026" → parse → format → "05/11/2026"', () => {
    const dataStr = '05/11/2026'
    const data = parseDataBrasileira(dataStr)
    expect(data).not.toBeNull()
    expect(formatarDataBrasileira(data!)).toBe(dataStr)
  })

  test('"29/02/2028" → parse → format → "29/02/2028"', () => {
    const dataStr = '29/02/2028'
    const data = parseDataBrasileira(dataStr)
    expect(data).not.toBeNull()
    expect(formatarDataBrasileira(data!)).toBe(dataStr)
  })

  test('"01/01/2026" → parse → format → "01/01/2026"', () => {
    const dataStr = '01/01/2026'
    const data = parseDataBrasileira(dataStr)
    expect(data).not.toBeNull()
    expect(formatarDataBrasileira(data!)).toBe(dataStr)
  })

  test('"31/12/2026" → parse → format → "31/12/2026"', () => {
    const dataStr = '31/12/2026'
    const data = parseDataBrasileira(dataStr)
    expect(data).not.toBeNull()
    expect(formatarDataBrasileira(data!)).toBe(dataStr)
  })
})

describe('converterParaISO', () => {
  test('"05/11/2026" → "2026-11-05"', () => {
    expect(converterParaISO('05/11/2026')).toBe('2026-11-05')
  })

  test('"29/02/2028" → "2028-02-29"', () => {
    expect(converterParaISO('29/02/2028')).toBe('2028-02-29')
  })

  test('"01/01/2026" → "2026-01-01"', () => {
    expect(converterParaISO('01/01/2026')).toBe('2026-01-01')
  })

  test('"31/12/2026" → "2026-12-31"', () => {
    expect(converterParaISO('31/12/2026')).toBe('2026-12-31')
  })

  test('Data inválida "31/02/2026" → null', () => {
    expect(converterParaISO('31/02/2026')).toBeNull()
  })

  test('Formato errado "2026-11-05" → null', () => {
    expect(converterParaISO('2026-11-05')).toBeNull()
  })
})

// ============================================================================
// hojeISO - Fuso America/Sao_Paulo
// ============================================================================

describe('hojeISO', () => {
  test('Date fixo no meio do dia (14:00 UTC = 11:00 SP) → data correta', () => {
    // 5 de novembro de 2026, 14:00 UTC
    const agora = new Date(Date.UTC(2026, 10, 5, 14, 0, 0))
    expect(hojeISO(agora)).toBe('2026-11-05')
  })

  test('Virada do dia: 02:59 UTC → ainda é dia anterior em SP (23:59 do dia 4)', () => {
    // 5 de novembro de 2026, 02:59 UTC = 4 de novembro, 23:59 em SP (UTC-3)
    const agora = new Date(Date.UTC(2026, 10, 5, 2, 59, 0))
    expect(hojeISO(agora)).toBe('2026-11-04')
  })

  test('Virada do dia: 03:00 UTC → já é dia novo em SP (00:00 do dia 5)', () => {
    // 5 de novembro de 2026, 03:00 UTC = 5 de novembro, 00:00 em SP (UTC-3)
    const agora = new Date(Date.UTC(2026, 10, 5, 3, 0, 0))
    expect(hojeISO(agora)).toBe('2026-11-05')
  })

  test('01/01/2026, 12:00 UTC → "2026-01-01"', () => {
    const agora = new Date(Date.UTC(2026, 0, 1, 12, 0, 0))
    expect(hojeISO(agora)).toBe('2026-01-01')
  })

  test('31/12/2026, 12:00 UTC → "2026-12-31"', () => {
    const agora = new Date(Date.UTC(2026, 11, 31, 12, 0, 0))
    expect(hojeISO(agora)).toBe('2026-12-31')
  })
})

// ============================================================================
// validarCriacaoDemanda / prepararDemanda
// ============================================================================

describe('validarCriacaoDemanda - Campos obrigatórios', () => {
  const dadosValidos = {
    titulo: 'Título válido',
    descricao: 'Descrição válida',
    dataSolicitacao: '05/11/2026',
    setor: 'TI' as const,
    status: 'Aberta' as const,
  }

  test('Título ausente → erro "Título é obrigatório"', () => {
    const dados = { ...dadosValidos, titulo: undefined }
    const resultado = validarCriacaoDemanda(dados)

    expect(resultado.success).toBe(false)
    if (!resultado.success) {
      const erros = formatarErrosValidacao(resultado.error)
      expect(erros.some((e) => e.campo === 'titulo' && e.mensagem === 'Título é obrigatório')).toBe(
        true,
      )
    }
  })

  test('Descrição ausente → erro "Descrição é obrigatória"', () => {
    const dados = { ...dadosValidos, descricao: undefined }
    const resultado = validarCriacaoDemanda(dados)

    expect(resultado.success).toBe(false)
    if (!resultado.success) {
      const erros = formatarErrosValidacao(resultado.error)
      expect(
        erros.some((e) => e.campo === 'descricao' && e.mensagem === 'Descrição é obrigatória'),
      ).toBe(true)
    }
  })

  test('Data de solicitação ausente → erro "Data de solicitação é obrigatória"', () => {
    const dados = { ...dadosValidos, dataSolicitacao: undefined }
    const resultado = validarCriacaoDemanda(dados)

    expect(resultado.success).toBe(false)
    if (!resultado.success) {
      const erros = formatarErrosValidacao(resultado.error)
      expect(
        erros.some(
          (e) =>
            e.campo === 'dataSolicitacao' && e.mensagem === 'Data de solicitação é obrigatória',
        ),
      ).toBe(true)
    }
  })

  test('Setor ausente → erro "Setor é obrigatório"', () => {
    const dados = { ...dadosValidos, setor: undefined }
    const resultado = validarCriacaoDemanda(dados)

    expect(resultado.success).toBe(false)
    if (!resultado.success) {
      const erros = formatarErrosValidacao(resultado.error)
      expect(erros.some((e) => e.campo === 'setor' && e.mensagem === 'Setor é obrigatório')).toBe(
        true,
      )
    }
  })

  test('Status ausente → erro "Status é obrigatório"', () => {
    const dados = { ...dadosValidos, status: undefined }
    const resultado = validarCriacaoDemanda(dados)

    expect(resultado.success).toBe(false)
    if (!resultado.success) {
      const erros = formatarErrosValidacao(resultado.error)
      expect(erros.some((e) => e.campo === 'status' && e.mensagem === 'Status é obrigatório')).toBe(
        true,
      )
    }
  })
})

describe('validarCriacaoDemanda - Múltiplos campos ausentes', () => {
  test('Todos os campos ausentes → um erro por campo', () => {
    const dados = {}
    const resultado = validarCriacaoDemanda(dados)

    expect(resultado.success).toBe(false)
    if (!resultado.success) {
      const erros = formatarErrosValidacao(resultado.error)
      expect(erros.length).toBe(5) // titulo, descricao, dataSolicitacao, setor, status
      expect(erros.some((e) => e.campo === 'titulo')).toBe(true)
      expect(erros.some((e) => e.campo === 'descricao')).toBe(true)
      expect(erros.some((e) => e.campo === 'dataSolicitacao')).toBe(true)
      expect(erros.some((e) => e.campo === 'setor')).toBe(true)
      expect(erros.some((e) => e.campo === 'status')).toBe(true)
    }
  })

  test('Título e descrição ausentes → dois erros separados', () => {
    const dados = {
      dataSolicitacao: '05/11/2026',
      setor: 'TI',
      status: 'Aberta',
    }
    const resultado = validarCriacaoDemanda(dados)

    expect(resultado.success).toBe(false)
    if (!resultado.success) {
      const erros = formatarErrosValidacao(resultado.error)
      expect(erros.length).toBe(2)
      expect(erros.some((e) => e.campo === 'titulo')).toBe(true)
      expect(erros.some((e) => e.campo === 'descricao')).toBe(true)
    }
  })
})

describe('validarCriacaoDemanda - Texto só com espaços', () => {
  test('Título só com espaços → tratado como ausente/vazio', () => {
    const dados = {
      titulo: '   ',
      descricao: 'Descrição válida',
      dataSolicitacao: '05/11/2026',
      setor: 'TI',
      status: 'Aberta',
    }
    const resultado = validarCriacaoDemanda(dados)

    expect(resultado.success).toBe(false)
    if (!resultado.success) {
      const erros = formatarErrosValidacao(resultado.error)
      expect(erros.some((e) => e.campo === 'titulo' && e.mensagem === 'Título é obrigatório')).toBe(
        true,
      )
    }
  })

  test('Descrição só com espaços → tratado como ausente/vazio', () => {
    const dados = {
      titulo: 'Título válido',
      descricao: '   ',
      dataSolicitacao: '05/11/2026',
      setor: 'TI',
      status: 'Aberta',
    }
    const resultado = validarCriacaoDemanda(dados)

    expect(resultado.success).toBe(false)
    if (!resultado.success) {
      const erros = formatarErrosValidacao(resultado.error)
      expect(
        erros.some((e) => e.campo === 'descricao' && e.mensagem === 'Descrição é obrigatória'),
      ).toBe(true)
    }
  })
})

describe('validarCriacaoDemanda - Valores fora da lista permitida', () => {
  test('Setor fora da lista → erro "Setor inválido"', () => {
    const dados = {
      titulo: 'Título válido',
      descricao: 'Descrição válida',
      dataSolicitacao: '05/11/2026',
      setor: 'SetorInexistente',
      status: 'Aberta',
    }
    const resultado = validarCriacaoDemanda(dados)

    expect(resultado.success).toBe(false)
    if (!resultado.success) {
      const erros = formatarErrosValidacao(resultado.error)
      expect(erros.some((e) => e.campo === 'setor' && e.mensagem === 'Setor inválido')).toBe(true)
    }
  })

  test('Status fora da lista → erro "Status inválido"', () => {
    const dados = {
      titulo: 'Título válido',
      descricao: 'Descrição válida',
      dataSolicitacao: '05/11/2026',
      setor: 'TI',
      status: 'StatusInexistente',
    }
    const resultado = validarCriacaoDemanda(dados)

    expect(resultado.success).toBe(false)
    if (!resultado.success) {
      const erros = formatarErrosValidacao(resultado.error)
      expect(erros.some((e) => e.campo === 'status' && e.mensagem === 'Status inválido')).toBe(true)
    }
  })
})

describe('validarCriacaoDemanda - Limites de caracteres', () => {
  test('Título com 151 caracteres → erro com o limite na mensagem', () => {
    const dados = {
      titulo: 'A'.repeat(151),
      descricao: 'Descrição válida',
      dataSolicitacao: '05/11/2026',
      setor: 'TI',
      status: 'Aberta',
    }
    const resultado = validarCriacaoDemanda(dados)

    expect(resultado.success).toBe(false)
    if (!resultado.success) {
      const erros = formatarErrosValidacao(resultado.error)
      expect(
        erros.some(
          (e) =>
            e.campo === 'titulo' && e.mensagem.includes('150') && e.mensagem.includes('exceder'),
        ),
      ).toBe(true)
    }
  })

  test('Descrição com 2001 caracteres → erro com o limite na mensagem', () => {
    const dados = {
      titulo: 'Título válido',
      descricao: 'A'.repeat(2001),
      dataSolicitacao: '05/11/2026',
      setor: 'TI',
      status: 'Aberta',
    }
    const resultado = validarCriacaoDemanda(dados)

    expect(resultado.success).toBe(false)
    if (!resultado.success) {
      const erros = formatarErrosValidacao(resultado.error)
      expect(
        erros.some(
          (e) =>
            e.campo === 'descricao' &&
            e.mensagem.includes('2000') &&
            e.mensagem.includes('exceder'),
        ),
      ).toBe(true)
    }
  })

  test('Título com 150 caracteres (exato no limite) → válido', () => {
    const dados = {
      titulo: 'A'.repeat(150),
      descricao: 'Descrição válida',
      dataSolicitacao: '05/11/2026',
      setor: 'TI',
      status: 'Aberta',
    }
    const resultado = validarCriacaoDemanda(dados)

    expect(resultado.success).toBe(true)
  })

  test('Descrição com 2000 caracteres (exato no limite) → válido', () => {
    const dados = {
      titulo: 'Título válido',
      descricao: 'A'.repeat(2000),
      dataSolicitacao: '05/11/2026',
      setor: 'TI',
      status: 'Aberta',
    }
    const resultado = validarCriacaoDemanda(dados)

    expect(resultado.success).toBe(true)
  })
})

describe('prepararDemanda - Prioridade calculada', () => {
  test('Descrição com "erro" → prioridade "Alta"', () => {
    const dados = {
      titulo: 'Relatório mensal',
      descricao: 'Erro ao gerar o relatório mensal',
      dataSolicitacao: '05/11/2026',
      setor: 'Financeiro',
      status: 'Aberta',
    }
    const resultado = prepararDemanda(dados)

    expect(resultado.sucesso).toBe(true)
    if (resultado.sucesso) {
      expect(resultado.dados.prioridade).toBe('Alta')
    }
  })

  test('Descrição sem palavras-chave → prioridade "Normal"', () => {
    const dados = {
      titulo: 'Relatório de vendas',
      descricao: 'Criar relatório de vendas por região',
      dataSolicitacao: '05/11/2026',
      setor: 'Comercial',
      status: 'Aberta',
    }
    const resultado = prepararDemanda(dados)

    expect(resultado.sucesso).toBe(true)
    if (resultado.sucesso) {
      expect(resultado.dados.prioridade).toBe('Normal')
    }
  })

  test('Campo "prioridade" enviado pelo cliente é ignorado (FR-014)', () => {
    const dados = {
      titulo: 'Relatório mensal',
      descricao: 'Erro ao gerar o relatório mensal',
      dataSolicitacao: '05/11/2026',
      setor: 'Financeiro',
      status: 'Aberta',
      prioridade: 'Normal', // Cliente tenta enviar "Normal" mas descrição tem "erro"
    }
    const resultado = prepararDemanda(dados)

    expect(resultado.sucesso).toBe(true)
    if (resultado.sucesso) {
      // A prioridade deve ser calculada pela descrição, não o valor enviado
      expect(resultado.dados.prioridade).toBe('Alta')
    }
  })

  test('Campo "prioridade" ausente → prioridade calculada normalmente', () => {
    const dados = {
      titulo: 'Acesso ao sistema',
      descricao: 'Preciso do acesso liberado, é urgente',
      dataSolicitacao: '05/11/2026',
      setor: 'TI',
      status: 'Aberta',
    }
    const resultado = prepararDemanda(dados)

    expect(resultado.sucesso).toBe(true)
    if (resultado.sucesso) {
      expect(resultado.dados.prioridade).toBe('Alta')
    }
  })

  test('Dados inválidos → prepararDemanda retorna erros', () => {
    const dados = {
      titulo: '',
      descricao: 'Descrição válida',
      dataSolicitacao: '05/11/2026',
      setor: 'TI',
      status: 'Aberta',
    }
    const resultado = prepararDemanda(dados)

    expect(resultado.sucesso).toBe(false)
    if (!resultado.sucesso) {
      expect(resultado.erros.length).toBeGreaterThan(0)
      expect(resultado.erros.some((e) => e.campo === 'titulo')).toBe(true)
    }
  })
})

describe('formatarErrosValidacao - Um erro por campo', () => {
  test('Mesmo que Zod reporte múltiplos problemas no mesmo campo, só a primeira mensagem aparece', () => {
    // Título vazio: falha em trim().min(1) e depois não testa .max()
    // Mas o formatarErrosValidacao deve retornar apenas um erro para o campo "titulo"
    const dados = {
      titulo: '',
      descricao: 'A'.repeat(2001), // excede o limite
      dataSolicitacao: '31/02/2026', // data inválida
      setor: 'SetorInvalido',
      status: 'StatusInvalido',
    }
    const resultado = validarCriacaoDemanda(dados)

    expect(resultado.success).toBe(false)
    if (!resultado.success) {
      const erros = formatarErrosValidacao(resultado.error)

      // Verifica que há apenas um erro por campo
      const camposComErro = erros.map((e) => e.campo)
      const camposUnicos = new Set(camposComErro)
      expect(camposComErro.length).toBe(camposUnicos.size)

      // Verifica que cada campo tem erro
      expect(erros.some((e) => e.campo === 'titulo')).toBe(true)
      expect(erros.some((e) => e.campo === 'descricao')).toBe(true)
      expect(erros.some((e) => e.campo === 'dataSolicitacao')).toBe(true)
      expect(erros.some((e) => e.campo === 'setor')).toBe(true)
      expect(erros.some((e) => e.campo === 'status')).toBe(true)
    }
  })
})
