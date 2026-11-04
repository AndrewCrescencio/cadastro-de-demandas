# Exemplos para Teste Manual do Sistema de Demandas

Este documento contém exemplos para teste manual das funcionalidades, baseados no Anexo A da especificação.

## Exemplos que devem gerar Prioridade Alta

### 1. Erro ao gerar relatório

```json
{
  "titulo": "Relatório mensal",
  "descricao": "Erro ao gerar o relatório mensal",
  "dataSolicitacao": "01/11/2026",
  "setor": "Financeiro",
  "status": "Aberta"
}
```

**Prioridade esperada:** Alta (contém "erro")

### 2. Acesso urgente

```json
{
  "titulo": "Acesso ao sistema",
  "descricao": "Preciso do acesso liberado, é urgente",
  "dataSolicitacao": "01/11/2026",
  "setor": "TI",
  "status": "Aberta"
}
```

**Prioridade esperada:** Alta (contém "urgente")

### 3. Maiúsculas

```json
{
  "titulo": "Contrato",
  "descricao": "URGENTE: contrato precisa de assinatura hoje",
  "dataSolicitacao": "01/11/2026",
  "setor": "Jurídico",
  "status": "Aberta"
}
```

**Prioridade esperada:** Alta (ignora maiúsculas/minúsculas)

### 4. Plural

```json
{
  "titulo": "Planilha de custos",
  "descricao": "Corrigir erros na planilha de custos",
  "dataSolicitacao": "01/11/2026",
  "setor": "Financeiro",
  "status": "Aberta"
}
```

**Prioridade esperada:** Alta (plural aceito)

### 5. Com pontuação

```json
{
  "titulo": "Fatura divergente",
  "descricao": "Valor divergente: erro-01 no cálculo da fatura",
  "dataSolicitacao": "01/11/2026",
  "setor": "Financeiro",
  "status": "Aberta"
}
```

**Prioridade esperada:** Alta (pontuação delimita palavra)

### 6. Com negação

```json
{
  "titulo": "Novo modelo",
  "descricao": "Não é urgente, mas gostaria de um novo modelo de relatório",
  "dataSolicitacao": "01/11/2026",
  "setor": "Administrativo",
  "status": "Aberta"
}
```

**Prioridade esperada:** Alta (negação não é interpretada)

## Exemplos que devem gerar Prioridade Normal

### 7. Sem palavras-chave

```json
{
  "titulo": "Relatório de vendas",
  "descricao": "Criar relatório de vendas por região",
  "dataSolicitacao": "01/11/2026",
  "setor": "Comercial",
  "status": "Aberta"
}
```

**Prioridade esperada:** Normal (sem palavras-chave)

### 8. Palavra dentro de outra (interrompe)

```json
{
  "titulo": "Envio de notas",
  "descricao": "Ajustar a rotina que interrompe o envio das notas",
  "dataSolicitacao": "01/11/2026",
  "setor": "Operações",
  "status": "Aberta"
}
```

**Prioridade esperada:** Normal ("erro" só aparece dentro de "interrompe")

### 9. Palavra dentro de outra (terror)

```json
{
  "titulo": "Prazo",
  "descricao": "O terror dos prazos precisa ser discutido",
  "dataSolicitacao": "01/11/2026",
  "setor": "RH",
  "status": "Aberta"
}
```

**Prioridade esperada:** Normal ("erro" só aparece dentro de "terror")

### 10. Palavra-chave só no título

```json
{
  "titulo": "Urgente: novo relatório",
  "descricao": "Criar relatório de vendas",
  "dataSolicitacao": "01/11/2026",
  "setor": "Comercial",
  "status": "Aberta"
}
```

**Prioridade esperada:** Normal (palavra-chave só no título, não na descrição)

### 11. Variação da palavra-chave

```json
{
  "titulo": "Entrega",
  "descricao": "Precisamos disso urgentemente",
  "dataSolicitacao": "01/11/2026",
  "setor": "Operações",
  "status": "Aberta"
}
```

**Prioridade esperada:** Normal ("urgentemente" não é palavra-chave)

## Casos de Validação (devem ser rejeitados)

### Campo obrigatório vazio

```json
{
  "titulo": "",
  "descricao": "Descrição válida",
  "dataSolicitacao": "01/11/2026",
  "setor": "TI",
  "status": "Aberta"
}
```

**Esperado:** Erro indicando que título é obrigatório

### Data futura

```json
{
  "titulo": "Teste",
  "descricao": "Teste de data futura",
  "dataSolicitacao": "01/01/2027",
  "setor": "TI",
  "status": "Aberta"
}
```

**Esperado:** Erro indicando que data não pode ser futura

### Data inválida

```json
{
  "titulo": "Teste",
  "descricao": "Teste de data inválida",
  "dataSolicitacao": "31/02/2026",
  "setor": "TI",
  "status": "Aberta"
}
```

**Esperado:** Erro indicando data inválida

### Título muito longo

```json
{
  "titulo": "A".repeat(151),
  "descricao": "Descrição válida",
  "dataSolicitacao": "01/11/2026",
  "setor": "TI",
  "status": "Aberta"
}
```

**Esperado:** Erro indicando limite de 150 caracteres

### Setor inválido

```json
{
  "titulo": "Teste",
  "descricao": "Teste de setor inválido",
  "dataSolicitacao": "01/11/2026",
  "setor": "SetorInexistente",
  "status": "Aberta"
}
```

**Esperado:** Erro indicando setor inválido

## Lista de Valores Válidos

### Setores

- Administrativo
- Comercial
- Financeiro
- Jurídico
- Operações
- RH
- TI
- Outros

### Status

- Aberta
- Em andamento
- Concluída
- Cancelada

### Prioridades (geradas automaticamente)

- Normal
- Alta
