<template>
  <div class="demanda-lista" data-cy="demanda-lista">
    <div class="filtros">
      <label for="filtro-status">Status</label>
      <select
        id="filtro-status"
        v-model="filtro.status"
        data-cy="filtro-status"
        @change="aplicarFiltros"
      >
        <option value="">Todos</option>
        <option v-for="s in STATUS_PERMITIDOS" :key="s" :value="s">{{ s }}</option>
      </select>

      <label for="filtro-setor">Setor</label>
      <select
        id="filtro-setor"
        v-model="filtro.setor"
        data-cy="filtro-setor"
        @change="aplicarFiltros"
      >
        <option value="">Todos</option>
        <option v-for="s in SETORES_PERMITIDOS" :key="s" :value="s">{{ s }}</option>
      </select>

      <label for="filtro-prioridade">Prioridade</label>
      <select
        id="filtro-prioridade"
        v-model="filtro.prioridade"
        data-cy="filtro-prioridade"
        @change="aplicarFiltros"
      >
        <option value="">Todas</option>
        <option v-for="p in PRIORIDADES_LIST" :key="p" :value="p">{{ p }}</option>
      </select>

      <button type="button" class="limpar" data-cy="btn-limpar-filtros" @click="limparFiltros">
        Limpar filtros
      </button>
    </div>

    <div v-if="carregando" class="resultado" data-cy="loading">
      <span>Carregando…</span>
    </div>

    <div v-else-if="erro" class="resultado" data-cy="erro-listagem">
      <span class="erro">{{ erro }}</span>
    </div>

    <div v-else-if="demandas.length === 0" class="resultado" data-cy="estado-vazio">
      <span class="vazio">
        {{
          filtrosAtivos
            ? 'Nenhuma demanda encontrada com os filtros selecionados.'
            : 'Nenhuma demanda cadastrada.'
        }}
      </span>
    </div>

    <table v-else class="tabela" data-cy="tabela-demandas">
      <thead>
        <tr>
          <th>Título</th>
          <th>Data de Solicitação</th>
          <th>Setor</th>
          <th>Status</th>
          <th>Prioridade</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="d in demandas"
          :key="d.id"
          class="linha"
          :data-cy="`demanda-${d.id}`"
          @click="irParaDetalhe(d.id)"
        >
          <td data-cy="demanda-titulo">{{ d.titulo }}</td>
          <td data-cy="demanda-data">{{ formatarData(d.dataSolicitacao) }}</td>
          <td data-cy="demanda-setor">{{ d.setor }}</td>
          <td data-cy="demanda-status">{{ d.status }}</td>
          <td data-cy="demanda-prioridade" :class="{ alta: d.prioridade === 'Alta' }">
            {{ d.prioridade }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { STATUS_PERMITIDOS, SETORES_PERMITIDOS, PRIORIDADES } from '#shared/utils/data'
import { useRouter } from '#imports'

const router = useRouter()

const props = defineProps({
  demandaInicial: {
    type: Object,
    default: null,
  },
})

const filtro = ref({})
const demandas = ref([])
const carregando = ref(false)
const erro = ref('')

const PRIORIDADES_LIST = PRIORIDADES

const filtrosAtivos = computed(() => {
  return !!filtro.value.status || !!filtro.value.setor || !!filtro.value.prioridade
})

function formatarData(iso) {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

function irParaDetalhe(id) {
  router.push(`/demanda/${id}`)
}

async function carregarDemandas() {
  carregando.value = true
  erro.value = ''

  try {
    const query = new URLSearchParams()
    if (filtro.value.status) query.set('status', filtro.value.status)
    if (filtro.value.setor) query.set('setor', filtro.value.setor)
    if (filtro.value.prioridade) query.set('prioridade', filtro.value.prioridade)

    const url = `/api/demandas${query.toString() ? `?${query.toString()}` : ''}`
    const data = await $fetch(url)
    demandas.value = data
  } catch (e) {
    erro.value = 'Erro ao carregar demandas. Tente novamente.'
    console.error(e)
  } finally {
    carregando.value = false
  }
}

function aplicarFiltros() {
  carregarDemandas()
}

function limparFiltros() {
  filtro.value = {}
  carregarDemandas()
}

onMounted(() => {
  carregarDemandas()

  if (props.demandaInicial) {
    demandas.value.unshift(props.demandaInicial)
  }
})
</script>

<style scoped>
.demanda-lista {
  max-width: 900px;
}

.filtros {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
  margin-bottom: 1rem;
}

.filtros label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #555;
  margin-bottom: 0.25rem;
  display: block;
}

.filtros select {
  padding: 0.4rem 0.6rem;
  font-size: 0.95rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: inherit;
  min-width: 140px;
}

.filtros .limpar {
  padding: 0.45rem 1rem;
  font-size: 0.95rem;
  background: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
}

.filtros .limpar:hover {
  background: #eaeaea;
}

.tabela {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.tabela th,
.tabela td {
  padding: 0.6rem 0.8rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.tabela th {
  background: #f8f8f8;
  font-weight: 600;
  color: #444;
  position: sticky;
  top: 0;
}

.tabela tr:last-child td {
  border-bottom: none;
}

.tabela tr:hover {
  background: #f5f5f5;
  cursor: pointer;
}

.alta {
  color: #d32f2f;
  font-weight: 600;
}

.vazio,
.erro {
  padding: 1.5rem;
  text-align: center;
  color: #666;
}

.erro {
  color: #d32f2f;
}
</style>
