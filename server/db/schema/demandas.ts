/**
 * Schema do banco de dados para demandas.
 *
 * FR-008: Identificador único automático e timestamp de criação
 * FR-009: Persistência durável
 */

import { pgTable, serial, varchar, text, date, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { STATUS_PERMITIDOS, SETORES_PERMITIDOS, PRIORIDADES } from '../utils/demandas/config'

// Enums do PostgreSQL para garantir integridade referencial
export const statusEnum = pgEnum('status_demanda', STATUS_PERMITIDOS)
export const setorEnum = pgEnum('setor_demanda', SETORES_PERMITIDOS)
export const prioridadeEnum = pgEnum('prioridade_demanda', PRIORIDADES)

/**
 * Tabela de demandas.
 */
export const demandas = pgTable('demandas', {
  // FR-008: Identificador único, sequencial/automático
  id: serial('id').primaryKey(),

  // FR-002, FR-007: Campos obrigatórios com limites
  titulo: varchar('titulo', { length: 150 }).notNull(),
  descricao: text('descricao').notNull(),

  // FR-005: Data válida, não futura (validado na aplicação)
  // Armazenada como DATE (YYYY-MM-DD) no banco
  dataSolicitacao: date('data_solicitacao', { mode: 'string' }).notNull(),

  // FR-006: Listas fechadas
  setor: setorEnum('setor').notNull(),
  status: statusEnum('status').notNull(),

  // FR-010: Prioridade calculada automaticamente
  prioridade: prioridadeEnum('prioridade').notNull(),

  // FR-008: Timestamp de criação
  criadoEm: timestamp('criado_em', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
})

export type DemandaDB = typeof demandas.$inferSelect
export type NovaDemandaDB = typeof demandas.$inferInsert
