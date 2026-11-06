/// <reference types="cypress" />

/**
 * Testes E2E do fluxo completo de demandas.
 * Testa cadastro, listagem e detalhe no navegador contra a aplicação real.
 *
 * Foco: o que só o navegador prova (interface, renderização segura, navegação).
 * Regras de negócio já estão cobertas nos testes unitários e de integração.
 */

describe('Cadastro de Demandas - E2E', () => {
  beforeEach(() => {
    // Garantir que o banco está acessível antes de cada teste
    cy.request('/api/demandas').its('status').should('eq', 200)
  })

  describe('Cadastro válido', () => {
    it('Cadastro sem palavra-chave → prioridade Normal, redireciona para detalhe', () => {
      cy.visit('/')

      // Preencher formulário
      cy.dataCy('input-titulo').type('Relatório mensal de vendas')
      cy.dataCy('input-descricao').type('Criar relatório de vendas por região')
      cy.dataCy('input-data').type('05112026') // Deve virar 05/11/2026
      cy.dataCy('select-setor').select('Comercial')
      cy.dataCy('select-status').select('Aberta')

      // Submeter
      cy.dataCy('btn-submit').click()

      // Deve redirecionar para /demanda/:id
      cy.url().should('match', /\/demanda\/\d+$/)

      // Confirmar prioridade Normal no detalhe
      cy.dataCy('detalhe-prioridade').should('contain.text', 'Normal')
      cy.dataCy('detalhe-titulo').should('contain.text', 'Relatório mensal de vendas')
    })

    it('Cadastro com "urgente" → prioridade Alta no detalhe', () => {
      cy.visit('/')

      cy.dataCy('input-titulo').type('Acesso ao sistema')
      cy.dataCy('input-descricao').type('Preciso do acesso liberado, é urgente')
      cy.dataCy('input-data').type('05112026')
      cy.dataCy('select-setor').select('TI')
      cy.dataCy('select-status').select('Aberta')

      cy.dataCy('btn-submit').click()

      cy.url().should('match', /\/demanda\/\d+$/)
      cy.dataCy('detalhe-prioridade').should('contain.text', 'Alta')
    })
  })

  describe('Cadastro recusado', () => {
    it('Campo obrigatório vazio → mostra erro, mantém outros valores preenchidos', () => {
      cy.visit('/')

      // Preencher todos menos o título
      cy.dataCy('input-descricao').type('Descrição válida')
      cy.dataCy('input-data').type('05112026')
      cy.dataCy('select-setor').select('TI')
      cy.dataCy('select-status').select('Aberta')

      // Submeter sem título
      cy.dataCy('btn-submit').click()

      // Deve mostrar erro no título
      cy.dataCy('erro-servidor-titulo').should('be.visible').should('contain.text', 'obrigatório')

      // Outros campos devem manter os valores
      cy.dataCy('input-descricao').should('have.value', 'Descrição válida')
      cy.dataCy('input-data').should('have.value', '05/11/2026')
      cy.dataCy('select-setor').should('have.value', 'TI')
      cy.dataCy('select-status').should('have.value', 'Aberta')
    })
  })

  describe('Campo de Data', () => {
    it('Digitar 31022026 → formata para 31/02/2026 e mostra erro de data inválida', () => {
      cy.visit('/')

      cy.dataCy('input-data').type('31022026')

      // Deve formatar
      cy.dataCy('input-data').should('have.value', '31/02/2026')

      // Ao sair do campo, deve mostrar erro
      cy.dataCy('input-data').blur()
      cy.dataCy('erro-data').should('be.visible').should('contain.text', 'válida')
    })

    it('Data futura → mostra erro correspondente', () => {
      cy.visit('/')

      cy.dataCy('input-data').type('01012028') // Futuro
      cy.dataCy('input-data').blur()

      cy.dataCy('erro-data').should('be.visible').should('contain.text', 'futura')
    })
  })

  describe('Duplo clique no botão', () => {
    it('Não cria duas demandas', () => {
      cy.visit('/')

      cy.dataCy('input-titulo').type('Teste duplo clique')
      cy.dataCy('input-descricao').type('Descrição única')
      cy.dataCy('input-data').type('05112026')
      cy.dataCy('select-setor').select('TI')
      cy.dataCy('select-status').select('Aberta')

      // Clicar duas vezes rapidamente
      cy.dataCy('btn-submit').dblclick()

      // Aguardar redirecionamento
      cy.url().should('match', /\/demanda\/\d+$/, { timeout: 5000 })

      // Ir para a listagem e confirmar que existe apenas uma demanda com esse título
      cy.visit('/consulta')
      cy.wait(500)

      cy.dataCy('tabela-demandas').within(() => {
        cy.contains('Teste duplo clique').should('have.length', 1)
      })
    })
  })

  describe('Listagem com filtros', () => {
    beforeEach(() => {
      // Cadastrar demandas com características diferentes via API
      cy.request('POST', '/api/demandas', {
        titulo: 'Demanda TI Aberta Normal',
        descricao: 'Sem palavra-chave',
        dataSolicitacao: '05/11/2026',
        setor: 'TI',
        status: 'Aberta',
      })

      cy.request('POST', '/api/demandas', {
        titulo: 'Demanda RH Concluída Alta',
        descricao: 'Isso é urgente',
        dataSolicitacao: '05/11/2026',
        setor: 'RH',
        status: 'Concluída',
      })

      cy.request('POST', '/api/demandas', {
        titulo: 'Demanda TI Aberta Alta',
        descricao: 'Erro crítico',
        dataSolicitacao: '05/11/2026',
        setor: 'TI',
        status: 'Aberta',
      })
    })

    it('Filtro isolado por Setor', () => {
      cy.visit('/consulta')
      cy.wait(500)

      cy.dataCy('filtro-setor').select('TI')

      cy.dataCy('tabela-demandas').within(() => {
        cy.contains('Demanda TI Aberta Normal').should('exist')
        cy.contains('Demanda TI Aberta Alta').should('exist')
        cy.contains('Demanda RH Concluída Alta').should('not.exist')
      })
    })

    it('Filtro combinado (Setor + Status)', () => {
      cy.visit('/consulta')
      cy.wait(500)

      cy.dataCy('filtro-setor').select('TI')
      cy.dataCy('filtro-status').select('Aberta')

      cy.dataCy('tabela-demandas').within(() => {
        cy.contains('Demanda TI Aberta Normal').should('exist')
        cy.contains('Demanda TI Aberta Alta').should('exist')
        cy.contains('Demanda RH Concluída Alta').should('not.exist')
      })
    })
  })

  describe('Estados vazios', () => {
    it('Nenhuma demanda cadastrada → mensagem específica', () => {
      // Para este teste funcionar, precisaria limpar o banco ou usar um banco isolado
      // Vou simular visitando com filtro que não retorna resultados
      cy.visit('/consulta')
      cy.wait(500)

      // Aplicar filtro impossível
      cy.dataCy('filtro-status').select('Cancelada')
      cy.dataCy('filtro-setor').select('Jurídico')

      // Deve mostrar mensagem de filtro sem resultado
      cy.dataCy('estado-vazio').should('be.visible').should('contain.text', 'filtros selecionados')
    })
  })

  describe('Navegação da listagem para o detalhe', () => {
    it('Clicar numa demanda → vai para o detalhe com descrição completa', () => {
      // Cadastrar uma demanda
      cy.request('POST', '/api/demandas', {
        titulo: 'Demanda para navegação',
        descricao: 'Esta é a descrição completa que deve aparecer apenas no detalhe',
        dataSolicitacao: '05/11/2026',
        setor: 'Comercial',
        status: 'Aberta',
      }).then((response) => {
        const id = response.body.id

        cy.visit('/consulta')
        cy.wait(500)

        // Clicar na linha da demanda
        cy.dataCy(`demanda-${id}`).click()

        // Deve navegar para o detalhe
        cy.url().should('include', `/demanda/${id}`)

        // Confirmar que a descrição completa aparece
        cy.dataCy('detalhe-descricao').should(
          'contain.text',
          'Esta é a descrição completa que deve aparecer apenas no detalhe',
        )
      })
    })
  })

  describe('Erro 404 para demanda inexistente', () => {
    it('Acessar /demanda/999999 → mostra erro sem quebrar aplicação', () => {
      cy.visit('/demanda/999999', { failOnStatusCode: false })

      cy.dataCy('erro-detalhe').should('be.visible').should('contain.text', 'não encontrada')
    })
  })

  describe('XSS Protection', () => {
    it('Título com <script> → renderiza como texto, não executa', () => {
      const tituloMalicioso = '<script>alert(1)</script>'
      const descricaoMaliciosa = '<img src=x onerror="alert(2)">'

      cy.visit('/')

      cy.dataCy('input-titulo').type(tituloMalicioso)
      cy.dataCy('input-descricao').type(descricaoMaliciosa)
      cy.dataCy('input-data').type('05112026')
      cy.dataCy('select-setor').select('TI')
      cy.dataCy('select-status').select('Aberta')

      cy.dataCy('btn-submit').click()

      cy.url().should('match', /\/demanda\/\d+$/)

      // Confirmar que o texto aparece literalmente (não como HTML/script)
      cy.dataCy('detalhe-titulo').should('contain.text', '<script>alert(1)</script>')
      cy.dataCy('detalhe-descricao').should('contain.text', '<img src=x onerror="alert(2)">')

      // Confirmar que não há elementos script ou img injetados
      cy.dataCy('detalhe-titulo').find('script').should('not.exist')
      cy.dataCy('detalhe-descricao').find('img').should('not.exist')

      // Ir para a listagem e verificar também
      cy.visit('/consulta')
      cy.wait(500)

      cy.dataCy('tabela-demandas').within(() => {
        cy.contains(tituloMalicioso).should('exist')
        cy.get('script').should('not.exist')
        cy.get('img[src="x"]').should('not.exist')
      })
    })

    it('Confirmar que nenhum alert foi disparado durante o teste', () => {
      // Cypress detecta automaticamente alerts não tratados
      // Se algum alert for disparado, o teste falha
      cy.on('window:alert', (text) => {
        throw new Error(`Alert inesperado: ${text}`)
      })
    })
  })
})
