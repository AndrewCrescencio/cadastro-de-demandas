<template>
  <div class="pagina">
    <div v-if="carregando" class="carregando">
      <span>Carregando…</span>
    </div>

    <div v-else-if="erro" class="erro-bloco">
      <span>{{ erro }}</span>
      <NuxtLink to="/consulta" class="link-voltar">Voltar à consulta</NuxtLink>
    </div>

    <div v-else-if="demanda" class="detalhe">
      <div class="cabecalho">
        <h1>{{ demanda.titulo }}</h1>
        <span class="badge" :class="{ alta: demanda.prioridade === 'Alta' }">
          {{ demanda.prioridade }}
        </span>
      </div>

      <div class="metadados">
        <p><strong>Data de Solicitação:</strong> {{ formatarData(demanda.dataSolicitacao) }}</p>
        <p><strong>Setor:</strong> {{ demanda.setor }}</p>
        <p><strong>Status:</strong> {{ demanda.status }}</p>
        <p><strong>Prioridade:</strong> {{ demanda.prioridade }}</p>
        <p><strong>Criado em:</strong> {{ formatarDataHora(demanda.criadoEm) }}</p>
      </div>

      <div class="descricao">
        <h2>Descrição</h2>
        <p>{{ demanda.descricao }}</p>
      </div>

      <div class="acoes">
        <NuxtLink to="/consulta" class="botao-voltar">Voltar à consulta</NuxtLink>
        <NuxtLink to="/" class="botao-nova">Cadastrar nova demanda</NuxtLink>
      </div>
    </div>

    <div v-else class="vazio">
      <span>Nenhuma demanda selecionada.</span>
      <NuxtLink to="/consulta" class="link-voltar">Voltar à consulta</NuxtLink>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from '#imports'

const route = useRoute()

const demanda = ref(null)
const carregando = ref(true)
const erro = ref('')

const id = Number(route.params.id)

function formatarData(iso) {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

function formatarDataHora(valor) {
  const data = new Date(valor)
  return data.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function carregarDemanda() {
  if (!id || id <= 0) {
    erro.value = 'ID de demanda inválido.'
    carregando.value = false
    return
  }

  carregando.value = true
  erro.value = ''

  try {
    const data = await $fetch(`/api/demandas/${id}`)
    demanda.value = data
  } catch (e) {
    const err = e
    if (err.statusCode === 404 || err.status === 404) {
      erro.value = 'Demanda não encontrada.'
    } else {
      erro.value = 'Erro ao carregar a demanda. Tente novamente.'
    }
    console.error(e)
  } finally {
    carregando.value = false
  }
}

onMounted(() => {
  carregarDemanda()
})
</script>

<style scoped>
.pagina {
  max-width: 720px;
  margin: 2rem auto;
  padding: 0 1rem;
}

h1 {
  font-size: 1.5rem;
  margin: 0 0 1rem 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.cabecalho {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.badge {
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  background: #e3f2fd;
  color: #1565c0;
}

.badge.alta {
  background: #ffebee;
  color: #d32f2f;
}

.metadados {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  color: #444;
}

.metadados p {
  margin: 0;
}

.descricao {
  margin-bottom: 1.5rem;
}

.descricao h2 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.descricao p {
  white-space: pre-wrap;
  line-height: 1.6;
  color: #333;
}

.acoes {
  display: flex;
  gap: 0.75rem;
}

.botao-voltar,
.botao-nova {
  padding: 0.5rem 1rem;
  font-size: 0.95rem;
  border-radius: 4px;
  text-decoration: none;
  font-family: inherit;
}

.botao-voltar {
  background: #f5f5f5;
  border: 1px solid #ccc;
  color: #333;
}

.botao-voltar:hover {
  background: #eaeaea;
}

.botao-nova {
  background: #1976d2;
  color: #fff;
  border: none;
}

.botao-nova:hover {
  background: #1565c0;
}

.carregando,
.erro-bloco,
.vazio {
  padding: 2rem;
  text-align: center;
  color: #666;
}

.erro-bloco {
  color: #d32f2f;
}

.link-voltar {
  color: #1976d2;
  text-decoration: none;
  margin-left: 0.5rem;
}

.link-voltar:hover {
  text-decoration: underline;
}
</style>
