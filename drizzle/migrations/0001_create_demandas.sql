-- Migration: Criação da tabela de demandas
-- Feature: 001-cadastro-demandas
-- Data: 2026-11-03

-- Criar enums
CREATE TYPE "prioridade_demanda" AS ENUM ('Normal', 'Alta');
CREATE TYPE "status_demanda" AS ENUM ('Aberta', 'Em andamento', 'Concluída', 'Cancelada');
CREATE TYPE "setor_demanda" AS ENUM ('Administrativo', 'Comercial', 'Financeiro', 'Jurídico', 'Operações', 'RH', 'TI', 'Outros');

-- Criar tabela
CREATE TABLE IF NOT EXISTS "demandas" (
  "id" serial PRIMARY KEY NOT NULL,
  "titulo" varchar(150) NOT NULL,
  "descricao" text NOT NULL,
  "data_solicitacao" date NOT NULL,
  "setor" "setor_demanda" NOT NULL,
  "status" "status_demanda" NOT NULL,
  "prioridade" "prioridade_demanda" NOT NULL,
  "criado_em" timestamp with time zone DEFAULT now() NOT NULL
);

-- Criar índices para otimizar consultas e filtros
CREATE INDEX idx_demandas_status ON "demandas" ("status");
CREATE INDEX idx_demandas_setor ON "demandas" ("setor");
CREATE INDEX idx_demandas_prioridade ON "demandas" ("prioridade");
CREATE INDEX idx_demandas_data_solicitacao ON "demandas" ("data_solicitacao" DESC);
CREATE INDEX idx_demandas_criado_em ON "demandas" ("criado_em" DESC);

-- Comentários para documentação
COMMENT ON TABLE "demandas" IS 'Tabela principal de demandas internas da organização';
COMMENT ON COLUMN "demandas"."id" IS 'Identificador único, sequencial/automático (FR-008)';
COMMENT ON COLUMN "demandas"."titulo" IS 'Título da demanda, obrigatório, máx 150 caracteres (FR-002, FR-007)';
COMMENT ON COLUMN "demandas"."descricao" IS 'Descrição da demanda, obrigatória, máx 2000 caracteres (FR-002, FR-007)';
COMMENT ON COLUMN "demandas"."data_solicitacao" IS 'Data de solicitação, válida e não futura (FR-005)';
COMMENT ON COLUMN "demandas"."setor" IS 'Setor solicitante, lista fechada (FR-006)';
COMMENT ON COLUMN "demandas"."status" IS 'Status atual, lista fechada (FR-006)';
COMMENT ON COLUMN "demandas"."prioridade" IS 'Prioridade calculada automaticamente (FR-010)';
COMMENT ON COLUMN "demandas"."criado_em" IS 'Timestamp de criação do registro (FR-008)';
