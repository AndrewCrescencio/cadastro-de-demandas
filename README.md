# Sistema de Cadastro de Demandas

Sistema web full-stack para cadastro e acompanhamento de demandas internas de uma organização, com definição automática de prioridade baseada na descrição.

---

## 📋 Índice

- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [🚀 Começar Rápido (Desenvolvimento)](#-começar-rápido-desenvolvimento)
- [🗄️ Banco de Dados para Testes](#-banco-de-dados-para-testes)
- [🧪 Testes](#-testes)
- [🔒 Segurança](#-segurança)
- [🔧 Makefile - Comandos Úteis](#-makefile---comandos-úteis)
- [☁️ Deploy na Vercel](#-deploy-na-vercel)
- [🤖 CI/CD](#-ci-cd)
- [📁 Estrutura do Projeto](#-estrutura-do-projeto)
- [📊 Scripts Disponíveis](#-scripts-disponíveis)

---

## ✨ Funcionalidades

- **Cadastro de demandas** com validação de campos obrigatórios
- **Definição automática de prioridade** baseada na descrição (palavras-chave: urgente, erro)
- **Consulta de demandas** com filtros por status, setor e prioridade
- **Visualização de detalhes** de cada demanda
- **Proteção contra XSS** (sanitização de entrada + Content Security Policy)
- **Testes automatizados**: unitários, integração, API e E2E

---

## 🛠️ Tecnologias

| Camada               | Tecnologia                 |
| -------------------- | -------------------------- |
| Frontend             | Nuxt 4 (Vue 3), TypeScript |
| Backend              | Nitro (H3)                 |
| ORM                  | Drizzle ORM                |
| Banco                | PostgreSQL 18              |
| Validação            | Zod                        |
| Testes Unitários/API | Vitest                     |
| Testes E2E           | Cypress                    |
| Lint                 | ESLint + Prettier          |
| Git Hooks            | Husky                      |
| Container            | Docker                     |

---

## 🚀 Começar Rápido (Desenvolvimento)

Siga estes passos para rodar o projeto localmente:

### 1. Instalar dependências

```bash
pnpm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

O `.env` padrão já aponta para PostgreSQL local na porta 5432. Ajuste se necessário.

### 3. Iniciar o banco de dados (PostgreSQL)

```bash
docker compose up -d postgres
```

Aguarde o banco estar pronto:

```bash
docker compose logs postgres -f
# Procure por: "database system is ready to accept connections"
```

### 4. Executar migrations

```bash
pnpm db:migrate
```

### 5. Iniciar o servidor de desenvolvimento

```bash
pnpm dev
```

Acesse: **http://localhost:3000**

---

## 🗄️ Banco de Dados para Testes

O projeto usa um banco separado para testes (`demandas_test`), evitando contaminação de dados entre desenvolvimento e testes.

### Configurar banco de testes

```bash
# 1. Copiar exemplo de variáveis de teste
cp .env.test.example .env.test

# 2. Criar banco e rodar migrations
make db-test

# 3. Verificar que está funcionando
make migrate-test
```

### Rodar testes de API com banco isolado

```bash
make test:api
```

---

## 🧪 Testes

### Tipos de teste

| Tipo           | Comando          | O que testa                                        |
| -------------- | ---------------- | -------------------------------------------------- |
| Unitários      | `pnpm test:unit` | Funções puras (prioridade, validação, sanitização) |
| API/Integração | `pnpm test:api`  | Endpoints HTTP com banco real                      |
| E2E (Cypress)  | `pnpm cy:run`    | Fluxo completo no navegador                        |
| Todos          | `pnpm test`      | Todos os testes Vitest                             |

### Executar testes

```bash
# Todos os testes Vitest
pnpm test

# Apenas unitários
pnpm test:unit

# Apenas API (requer banco de testes configurado)
pnpm test:api

# Modo watch (desenvolvimento)
pnpm test:watch
```

### Testes E2E com Cypress

```bash
# Headless (CI)
pnpm cy:run

# Interface visual (desenvolvimento)
pnpm cy:open

# Servidor dev + Cypress
pnpm test:e2e
```

---

## 🔒 Segurança

### Sanitização XSS

O backend sanitiza entradas de texto removendo tags HTML perigosas (`<script>`, `<img>`, `<iframe>`, etc.) antes de armazenar. Caracteres perigosos são escapados.

### Content Security Policy (CSP)

Um cabeçalho CSP é enviado em todas as respostas, bloqueando scripts inline, `eval()` e recursos de origens não confiáveis.

---

## 🔧 Makefile - Comandos Úteis

```bash
make help              # Lista todos os alvos
make init              # Do zero ao banco migrado
make setup             # Instala dependências e gera tipos Nuxt
make db                # Sobe PostgreSQL via Docker
make db:migrate        # Executa migrations no banco de desenvolvimento
make db-test           # Cria e migra banco de testes (demandas_test)
make migrate-test      # Reexecuta migrations no banco de testes
make test:api          # Roda testes de API com banco de testes
make dev               # Sobe stack dev (foreground)
make dev-d             # Sobe stack dev (background)
make prod              # Sobe stack de produção
make studio            # Abre Drizzle Studio
```

---

## ☁️ Deploy na Vercel

O projeto está configurado para deploy automático na Vercel via CI/CD (GitHub Actions).

### Pré-requisitos

1. Conta na [Vercel](https://vercel.com)
2. Repositório conectado ao GitHub
3. Variáveis de ambiente configuradas na Vercel:
   - `DATABASE_URL` - URL do PostgreSQL de produção

### Como fazer deploy

1. Faça push para a branch `main` (ou `dev`, conforme configurado)
2. O GitHub Actions executará testes e fará deploy automático
3. Acesse a URL fornecida pela Vercel

### Configurar variáveis na Vercel

No painel da Vercel: **Settings → Environment Variables**, adicione:

```
DATABASE_URL=postgresql://usuario:senha@host:5432/banco
NODE_ENV=production
```

---

## 🤖 CI/CD

O projeto usa **GitHub Actions** para integração contínua e deploy contínuo.

### Workflow: `.github/workflows/ci-cd.yml`

Executado em todo `push` e `pull request`:

1. **Instalar dependências** (`pnpm install`)
2. **Rodar testes unitários** (`pnpm test:unit`)
3. **Rodar testes de API** (com banco de testes PostgreSQL via Docker)
4. **Lint** (`pnpm lint`)
5. **Typecheck** (`pnpm typecheck`)
6. **Build** (`pnpm build`)
7. **Deploy na Vercel** (apenas na branch `main`)

### Arquivos de CI/CD

| Arquivo                       | Descrição                            |
| ----------------------------- | ------------------------------------ |
| `.github/workflows/ci-cd.yml` | Pipeline principal (testes + deploy) |

---

## 📁 Estrutura do Projeto

```
cadastro-de-demandas/
├── .github/
│   └── workflows/
│       └── ci-cd.yml          # Pipeline CI/CD
├── .env.example               # Exemplo de variáveis (desenvolvimento)
├── .env.test.example          # Exemplo de variáveis (testes)
├── .gitignore                 # Arquivos ignorados pelo Git
├── Dockerfile                 # Container da aplicação
├── docker-compose.yml         # PostgreSQL para desenvolvimento
├── Makefile                   # Comandos de automação
├── drizzle.config.ts          # Configuração Drizzle Kit
├── nuxt.config.ts             # Configuração Nuxt
├── package.json               # Dependências e scripts
├── pnpm-workspace.yaml        # Workspace pnpm
├── tsconfig.json              # Configuração TypeScript
├── vitest.config.ts           # Configuração base Vitest
├── vitest.api.config.ts       # Configuração testes de API
├── vitest.app.config.ts       # Configuração testes de componentes Vue
├── app/                       # Frontend (Nuxt/Vue)
│   ├── pages/
│   │   ├── index.vue          # Cadastro de demanda
│   │   ├── consulta.vue       # Listagem e filtros
│   │   └── demanda/[id].vue   # Detalhes da demanda
│   └── components/
│       ├── DemandaForm.vue
│       ├── DemandaList.vue
│       └── DemandaFilter.vue
├── server/                    # Backend (Nitro)
│   ├── api/
│   │   └── demandas/
│   │       ├── index.get.ts   # GET /api/demandas
│   │       ├── index.post.ts  # POST /api/demandas
│   │       ├── [id].get.ts    # GET /api/demandas/:id
│   │       └── resumo.get.ts  # GET /api/demandas/resumo
│   ├── middleware/
│   │   └── csp.ts             # Content Security Policy
│   ├── utils/
│   │   ├── demandas/
│   │   │   ├── config.ts
│   │   │   ├── prioridade.ts
│   │   │   └── validacao.ts   # + sanitização XSS
│   │   ├── db/
│   │   │   └── index.ts       # Conexão PostgreSQL
│   │   └── shared/
│   │       ├── errors.ts
│   │       └── validate.ts
│   ├── db/
│   │   └── schema/
│   │       └── demandas.ts
│   └── error-handler.ts
├── shared/
│   └── types/
│       └── demanda.ts
├── test/                      # Testes automatizados
│   ├── api/
│   │   ├── post-demandas.test.ts
│   │   ├── get-demandas.test.ts
│   │   └── get-demanda-id.test.ts
│   ├── unit/
│   │   ├── demandas.test.ts
│   │   └── security/
│   │       └── sanitizacao.test.ts
│   ├── pbt/
│   │   ├── xss-bug-condition.test.ts
│   │   └── xss-preservation.test.ts
│   └── setup/
│       ├── db-cleanup.ts      # Limpeza de banco entre testes
│       └── api-setup.ts
├── cypress/                   # Testes E2E
│   ├── e2e/
│   │   └── demandas.cy.ts
│   ├── support/
│   │   ├── commands.ts
│   │   └── e2e.ts
│   └── cypress.config.ts
├── drizzle/                   # Migrations SQL
└── docs/                      # Documentação adicional
```

---

## 📊 Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev            # Servidor de desenvolvimento (localhost:3000)
pnpm build          # Build de produção
pnpm preview        # Preview do build de produção

# Testes
pnpm test           # Todos os testes Vitest
pnpm test:unit      # Testes unitários
pnpm test:api       # Testes de API (requer banco de testes)
pnpm test:watch     # Modo watch

# E2E
pnpm cy:run         # Cypress headless
pnpm cy:open        # Cypress interface visual
pnpm test:e2e       # Servidor + Cypress

# Qualidade de código
pnpm lint           # ESLint
pnpm lint:fix       # ESLint com auto-correção
pnpm format         # Prettier formatar
pnpm format:check   # Verificar formatação
pnpm typecheck      # Verificação de tipos TypeScript
pnpm check          # Formato + lint + typecheck

# Banco de dados
pnpm db:migrate     # Executar migrations
npx drizzle-kit studio  # Drizzle Studio
```

---

## 📚 Documentação Adicional

- [Exemplos de Teste Manual](docs/exemplos-teste-demandas.md) - Casos de teste para validação manual

## 📄 Licença

Projeto desenvolvido como solução para o desafio "Sistema Web de Cadastro de Demandas".

## 👤 Autor

Novembro 2026
