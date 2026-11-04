# Sistema de Cadastro de Demandas

Sistema web full-stack para cadastro e acompanhamento de demandas internas de uma organização, com definição automática de prioridade baseada na descrição.

## 📋 Descrição do Projeto

Este projeto foi desenvolvido como solução para o desafio "Sistema Web de Cadastro de Demandas", permitindo que qualquer área de uma organização registre e consulte demandas internas de forma organizada.

### Funcionalidades

- ✅ **Cadastro de demandas** com validação de campos obrigatórios
- ✅ **Definição automática de prioridade** a partir da descrição
- ✅ **Consulta de demandas** com filtros por status, setor e prioridade
- ✅ **Visualização de detalhes** de cada demanda
- ⚡ **Resumo visual** (opcional) com estatísticas agregadas

## 🛠️ Tecnologias Utilizadas

### Frontend

- **Nuxt 4** (Vue 3) - Framework full-stack moderno
- **TypeScript** - Tipagem estática para maior segurança

### Backend

- **Nitro** - Server engine do Nuxt (H3)
- **Drizzle ORM** - ORM type-safe para PostgreSQL
- **Zod** - Validação de schemas e dados
- **PostgreSQL 18** - Banco de dados relacional

### Qualidade & DevOps

- **Vitest** - Framework de testes unitários e integração
- **ESLint** - Linter de código
- **Prettier** - Formatação de código
- **Husky** - Git hooks para CI
- **Docker** - Containerização do banco de dados

## 📁 Como a Solução Foi Estruturada

```
cadastro-de-demandas/
├── app/                          # Frontend (Nuxt/Vue)
│   ├── pages/
│   │   ├── index.vue            # Página de cadastro
│   │   ├── consulta.vue         # Página de listagem/filtros
│   │   └── demanda/[id].vue     # Detalhes de uma demanda
│   └── components/
│       ├── DemandaForm.vue      # Formulário de cadastro
│       ├── DemandaList.vue      # Lista de demandas
│       └── DemandaFilter.vue    # Filtros de consulta
│
├── server/                       # Backend (Nitro)
│   ├── api/
│   │   └── demandas/
│   │       ├── index.get.ts     # GET /api/demandas (listar)
│   │       ├── index.post.ts    # POST /api/demandas (criar)
│   │       ├── [id].get.ts      # GET /api/demandas/:id (detalhes)
│   │       └── resumo.get.ts    # GET /api/demandas/resumo (estatísticas)
│   ├── utils/
│   │   ├── demandas/
│   │   │   ├── config.ts        # Configuração (setores, status, palavras-chave)
│   │   │   ├── prioridade.ts    # Regra de prioridade automática
│   │   │   └── validacao.ts     # Validação de campos
│   │   ├── db/
│   │   │   └── index.ts         # Conexão com banco de dados
│   │   └── shared/
│   │       ├── errors.ts        # Tratamento de erros
│   │       └── validate.ts      # Utilitários de validação
│   ├── db/
│   │   └── schema/
│   │       └── demandas.ts      # Schema da tabela
│   └── error-handler.ts         # Error handler global
│
├── shared/                       # Código compartilhado
│   └── types/
│       └── demanda.ts           # Tipos TypeScript
│
├── tests/                        # Testes automatizados
│   ├── unit/
│   │   ├── prioridade.test.ts   # Testes da regra de prioridade
│   │   └── validacao.test.ts    # Testes de validação
│   └── integration/
│       └── demandas.test.ts     # Testes de API (a implementar)
│
├── drizzle/                      # Migrations do banco
│   └── migrations/
│       └── 0001_create_demandas.sql
│
└── docs/                         # Documentação
    └── exemplos-teste-demandas.md
```

### Separação de Responsabilidades

A arquitetura segue o princípio de **separação de responsabilidades**:

1. **Camada de Apresentação** (`app/`) - Interface do usuário
2. **Camada de API** (`server/api/`) - Endpoints HTTP
3. **Camada de Negócio** (`server/utils/`) - Lógica de negócio isolada e testável
4. **Camada de Dados** (`server/db/`) - Acesso ao banco de dados

## 🎯 Como a Regra de Prioridade Foi Implementada

A regra de prioridade está implementada em `server/utils/demandas/prioridade.ts` como uma **função pura e testável**:

```typescript
export function calcularPrioridade(descricao: string): Prioridade {
  // Normaliza para lowercase
  const descricaoNormalizada = descricao.toLowerCase()

  // Busca palavras-chave completas (word boundaries)
  for (const palavra of PALAVRAS_CHAVE_ALTA_PRIORIDADE) {
    const regex = new RegExp(`\\b${palavra}\\b`, 'i')

    if (regex.test(descricaoNormalizada)) {
      return 'Alta'
    }
  }

  return 'Normal'
}
```

### Características da Implementação

- ✅ **Case-insensitive**: "URGENTE", "urgente", "Urgente" são tratados igualmente
- ✅ **Palavra completa**: "erro" em "erro-404" conta, mas não em "terror"
- ✅ **Aceita plural**: "urgente", "urgentes", "erro", "erros"
- ✅ **Configurável**: Palavras-chave definidas em `config.ts` (fácil de estender)
- ✅ **Testável**: Função pura sem dependências externas

### Palavras-Chave (Padrão)

- **Alta prioridade**: `urgente`, `urgentes`, `erro`, `erros`
- **Normal**: Qualquer descrição que não contenha as palavras acima

Para adicionar novas palavras-chave (ex: "crítico", "bloqueado"), basta editar `server/utils/demandas/config.ts`.

## 🧪 Testes Automatizados

O projeto inclui **95 testes automatizados** cobrindo:

### Testes Unitários (47 testes de prioridade)

- ✅ Todos os 12 exemplos especificados no desafio
- ✅ Casos de borda (pontuação, negação, plural, maiúsculas)
- ✅ Variações que não devem ativar a regra

### Testes de Validação (48 testes)

- ✅ Campos obrigatórios
- ✅ Limites de caracteres (150 para título, 2000 para descrição)
- ✅ Validação de data (formato DD/MM/AAAA, não futura)
- ✅ Listas fechadas (setores e status)

Para executar os testes:

```bash
pnpm test           # Todos os testes
pnpm test:unit      # Apenas testes unitários
pnpm test:watch     # Modo watch
```

## 🚀 Como Executar

### Pré-requisitos

- **Node.js** >= 24.0.0
- **pnpm** (gerenciador de pacotes)
- **Docker** (para o banco de dados)

### 1. Instalar Dependências

```bash
pnpm install
```

### 2. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite o `.env` se necessário (valores padrão já funcionam).

### 3. Iniciar o Banco de Dados

```bash
docker compose up -d postgres
```

Aguarde o banco estar pronto:

```bash
docker compose logs postgres -f
# Aguarde ver: "database system is ready to accept connections"
```

### 4. Executar Migrations

```bash
pnpm db:migrate
```

### 5. Iniciar o Servidor de Desenvolvimento

```bash
pnpm dev
```

Acesse: **http://localhost:3000**

### 6. (Opcional) Verificar Qualidade do Código

```bash
pnpm check          # Formato, lint e typecheck
pnpm test           # Executar testes
```

## 🐳 Docker

### Banco de Dados

O `docker-compose.yml` configura um PostgreSQL 18 para desenvolvimento:

```bash
docker compose up -d        # Iniciar
docker compose down         # Parar
docker compose down -v      # Parar e remover dados
docker compose logs -f      # Ver logs
```

### Aplicação (Futuro)

O `Dockerfile` está preparado para build de produção:

```bash
docker build -t cadastro-demandas .
docker run -p 3000:3000 cadastro-demandas
```

## 📊 Principais Decisões Tomadas

### 1. Arquitetura Monolítica com Nuxt Full-Stack

**Decisão**: Usar Nuxt 4 (full-stack) ao invés de separar frontend e backend.

**Justificativa**:

- Simplicidade de deploy (um único serviço)
- Type-safety end-to-end (tipos compartilhados)
- Hot Module Replacement (HMR) em dev
- SSR/SSG quando necessário

### 2. Drizzle ORM

**Decisão**: Usar Drizzle ao invés de Prisma ou SQL raw.

**Justificativa**:

- Type-safe e leve
- Migrations SQL transparentes
- Sem runtime overhead
- Controle fino sobre queries

### 3. Validação em Duas Camadas

**Decisão**: Validar no cliente (UX) E no servidor (segurança).

**Justificativa**:

- Cliente: feedback imediato, melhor UX
- Servidor: garantia de integridade, não confiar no cliente

### 4. Configuração Centralizada

**Decisão**: Palavras-chave, setores e status em `config.ts`.

**Justificativa**:

- Single Source of Truth
- Fácil personalização por organização
- Evita hard-coded values espalhados

### 5. Testes Unitários Extensivos

**Decisão**: 95 testes cobrindo regras de negócio.

**Justificativa**:

- Confiança em refatorações
- Documentação viva do comportamento esperado
- Previne regressões

### 6. Data no Formato Brasileiro (DD/MM/AAAA)

**Decisão**: Entrada/exibição em DD/MM/AAAA, armazenamento em ISO 8601.

**Justificativa**:

- Familiar para usuários brasileiros
- ISO 8601 no banco para portabilidade
- Conversão apenas nas bordas (input/output)

### 7. Prioridade Gravada (Não Calculada)

**Decisão**: Calcular e gravar a prioridade no cadastro.

**Justificativa**:

- Edição está fora do escopo (não há recálculo)
- Performance: evita processar descrição a cada consulta
- Histórico: preserva prioridade mesmo se regras mudarem

## 📚 Documentação Adicional

- [Exemplos de Teste Manual](docs/exemplos-teste-demandas.md) - Casos de teste para validação manual

## 🔧 Scripts Disponíveis

```bash
pnpm dev            # Desenvolvimento (http://localhost:3000)
pnpm build          # Build de produção
pnpm preview        # Preview do build
pnpm test           # Executar todos os testes
pnpm test:unit      # Testes unitários
pnpm test:watch     # Testes em modo watch
pnpm lint           # Verificar código com ESLint
pnpm lint:fix       # Corrigir problemas de lint
pnpm format         # Formatar código com Prettier
pnpm format:check   # Verificar formatação
pnpm typecheck      # Verificar tipos TypeScript
pnpm check          # Formato + lint + typecheck
pnpm db:migrate     # Executar migrations do banco
```

## 🎨 Interface

A interface foi desenvolvida com foco em **funcionalidade e clareza**, priorizando:

- Formulários simples e objetivos
- Mensagens de erro claras em português
- Feedback visual de validação
- Estados vazios informativos

Não há foco em sofisticação visual, conforme especificado no desafio.

## 📝 Entidades

### Demanda

| Campo               | Tipo               | Regra                                       |
| ------------------- | ------------------ | ------------------------------------------- |
| ID                  | Número (serial)    | Gerado automaticamente                      |
| Título              | String (até 150)   | Obrigatório                                 |
| Descrição           | String (até 2000)  | Obrigatório                                 |
| Data de Solicitação | Date               | Obrigatório, não futura, formato DD/MM/AAAA |
| Setor               | Enum               | Obrigatório, lista fechada                  |
| Status              | Enum               | Obrigatório, lista fechada                  |
| Prioridade          | Enum (Alta/Normal) | Calculada automaticamente                   |
| Criado em           | Timestamp          | Gerado automaticamente                      |

### Valores Permitidos

**Setores**: Administrativo, Comercial, Financeiro, Jurídico, Operações, RH, TI, Outros

**Status**: Aberta, Em andamento, Concluída, Cancelada

**Prioridades**: Normal, Alta (calculada automaticamente)

## 🚀 Próximos Passos (Roadmap)

- [ ] Implementar endpoints da API (POST, GET)
- [ ] Implementar frontend (formulário, listagem, detalhes)
- [ ] Testes de integração
- [ ] Resumo visual (Power BI / Excel)
- [ ] Deploy em produção

## 📄 Licença

Este projeto foi desenvolvido como parte de um desafio técnico.

## 👤 Autor

Desenvolvido como solução para o desafio "Sistema Web de Cadastro de Demandas".

**Data**: Novembro 2026
