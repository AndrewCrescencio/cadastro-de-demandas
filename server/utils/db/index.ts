/**
 * Conexão com o banco de dados PostgreSQL usando Drizzle ORM.
 */

import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'

// Validar DATABASE_URL
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não configurada no arquivo .env')
}

// Criar conexão postgres
const client = postgres(process.env.DATABASE_URL)

// Criar instância do Drizzle
export const db = drizzle(client)

// Para uso em testes
export { client }
