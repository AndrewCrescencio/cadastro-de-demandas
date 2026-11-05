/**
 * Repositório de demandas.
 *
 * RNF-003: O acesso ao armazenamento fica encapsulado no repositório,
 * separado da interface HTTP (server/api) e da lógica de negócio
 * (validação e cálculo de prioridade em server/utils/demandas).
 *
 * FR-008: Identificador único automático e timestamp de criação (gerados pelo banco)
 * FR-009: Persistência durável
 */

import { db } from '../db'
import { demandas } from '../../db/schema/demandas'
import { converterParaISO } from './validacao'
import type { DemandaNova } from './validacao'
import type { Demanda } from '#shared/types/demanda'

/**
 * Contrato do repositório. Permite trocar ou mockar o armazenamento
 * sem tocar na camada de negócio nem na interface HTTP.
 */
export interface DemandaRepositorio {
  inserir(dados: DemandaNova): Promise<Demanda>
}

/**
 * Cria um repositório que persiste demandas no PostgreSQL via Drizzle.
 * `database` é injetável (default: conexão real) para facilitar testes.
 */
export function criarDemandaRepositorio(database: typeof db = db): DemandaRepositorio {
  return {
    async inserir(dados) {
      const [linha] = await database
        .insert(demandas)
        .values({
          titulo: dados.titulo,
          descricao: dados.descricao,
          // Entrada está em DD/MM/AAAA; o banco armazena ISO 8601.
          // A validação já garante que a data é válida (não é nulo aqui).
          dataSolicitacao: converterParaISO(dados.dataSolicitacao)!,
          setor: dados.setor,
          status: dados.status,
          prioridade: dados.prioridade,
        })
        .returning()

      if (!linha) {
        throw new Error('Não foi possível criar a demanda')
      }

      return {
        id: linha.id,
        titulo: linha.titulo,
        descricao: linha.descricao,
        dataSolicitacao: linha.dataSolicitacao,
        setor: linha.setor,
        status: linha.status,
        prioridade: linha.prioridade,
        criadoEm: linha.criadoEm,
      } as Demanda
    },
  }
}
