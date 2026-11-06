/**
 * Testes unitários para a função sanitizarTexto.
 * Valida a remoção de XSS e preservação de conteúdo seguro.
 *
 * Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import { describe, it, expect } from 'vitest'
import { sanitizarTexto } from '../../../server/utils/demandas/validacao'

describe('sanitizarTexto - Remoção de XSS', () => {
  it('remove script tags completamente', () => {
    const resultado = sanitizarTexto('<script>alert(1)</script>Normal')
    expect(resultado).toBe('Normal')
    expect(resultado).not.toContain('<script')
    expect(resultado).not.toContain('alert(1)')
  })

  it('remove script tags sem conteúdo restante', () => {
    const resultado = sanitizarTexto('<script>alert(1)</script>')
    expect(resultado).toBe('')
  })

  it('remove tags img com event handlers', () => {
    const resultado = sanitizarTexto('<img src=x onerror="alert(2)">')
    expect(resultado).toBe('')
    expect(resultado).not.toContain('<img')
    expect(resultado).not.toContain('onerror')
    expect(resultado).not.toContain('alert(2)')
  })

  it('remove links com protocolo javascript', () => {
    const resultado = sanitizarTexto('<a href="javascript:alert(3)">Click</a>')
    expect(resultado).toBe('Click')
    expect(resultado).not.toContain('<a')
    expect(resultado).not.toContain('javascript:')
    expect(resultado).not.toContain('href')
  })

  it('remove iframe tags', () => {
    const resultado = sanitizarTexto('<iframe src="evil.com"></iframe>')
    expect(resultado).toBe('')
    expect(resultado).not.toContain('<iframe')
    expect(resultado).not.toContain('evil.com')
  })

  it('remove event handlers em div e span', () => {
    const resultado = sanitizarTexto(
      '<div onclick="alert(1)">Text</div><span onmouseover="alert(2)">Hover</span>',
    )
    expect(resultado).toBe('TextHover')
    expect(resultado).not.toContain('onclick')
    expect(resultado).not.toContain('onmouseover')
    expect(resultado).not.toContain('<div')
    expect(resultado).not.toContain('<span')
  })

  it('remove múltiplos vetores XSS combinados', () => {
    const resultado = sanitizarTexto('<script>alert("xss")</script>Teste<img src=x onerror="xss">')
    expect(resultado).toBe('Teste')
    expect(resultado).not.toContain('<')
    expect(resultado).not.toContain('>')
    expect(resultado).not.toContain('script')
    expect(resultado).not.toContain('onerror')
  })

  it('escapa caracteres perigosos restantes (tags são removidas, não escapadas)', () => {
    const resultado = sanitizarTexto('Teste & <tag> "aspas" \'aspas simples\'')
    // <tag> é removido como tag HTML, & é escapado, aspas são escapadas
    expect(resultado).toBe('Teste &amp;  &quot;aspas&quot; &#x27;aspas simples&#x27;')
    expect(resultado).not.toContain('<')
    expect(resultado).not.toContain('>')
  })

  it('trim espaços nas extremidades', () => {
    const resultado = sanitizarTexto('  Texto com espaços  ')
    expect(resultado).toBe('Texto com espaços')
  })
})

describe('sanitizarTexto - Preservação de conteúdo seguro', () => {
  it('preserva texto plano simples', () => {
    const texto = 'Demanda de manutenção do sistema'
    expect(sanitizarTexto(texto)).toBe(texto)
  })

  it('preserva caracteres portugueses com acentos', () => {
    const texto = 'Descrição da ação necessária - não será adiado'
    expect(sanitizarTexto(texto)).toBe(texto)
    expect(sanitizarTexto(texto)).toContain('ção')
    expect(sanitizarTexto(texto)).toContain('ção')
    expect(sanitizarTexto(texto)).toContain('ã')
  })

  it('preserva todos os caracteres acentuados portugueses', () => {
    const acentos = 'áéíóúâêôãõàÁÉÍÓÚÂÊÔÃÕÀçÇ'
    const resultado = sanitizarTexto(acentos)
    expect(resultado).toBe(acentos)
  })

  it('preserva notação financeira R$ 1.234,56', () => {
    const texto = 'Custo: R$ 1.234,56'
    expect(sanitizarTexto(texto)).toBe(texto)
  })

  it('preserva pontuação segura', () => {
    const texto = 'Quantidade: 42 unidades! Prioridade alta? Sim.'
    expect(sanitizarTexto(texto)).toBe(texto)
  })

  it('preserva símbolos comuns (#, -, ., (), @, |, :, $, ,)', () => {
    const texto =
      'Projeto #42 - Fase 2.0 (atualização) | user@domain.com | (11) 9999-8888 | R$ 5.000,00'
    expect(sanitizarTexto(texto)).toBe(texto)
  })

  it('preserva números e versões alfanuméricas', () => {
    const texto = 'Demanda #12345 versão 2.1.0 - Sistema v3.14.159'
    expect(sanitizarTexto(texto)).toBe(texto)
  })

  it('texto vazio retorna string vazia', () => {
    expect(sanitizarTexto('')).toBe('')
  })

  it('apenas espaços retorna string vazia após trim', () => {
    expect(sanitizarTexto('   ')).toBe('')
  })
})
