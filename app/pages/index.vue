<template>
  <div class="pagina">
    <h1>Nova Demanda</h1>
    <DemandaForm @submit="aoCadastrar" />
  </div>
</template>

<script setup>
import DemandaForm from '~/components/DemandaForm.vue'
import { useRouter } from '#imports'

const router = useRouter()

async function aoCadastrar(resposta) {
  const id = resposta?.id ?? resposta?.demanda?.id
  if (id) {
    await router.push(`/demanda/${id}`)
  }
}
</script>

<style scoped>
.pagina {
  max-width: 520px;
  margin: 2rem auto;
  padding: 0 1rem;
}

h1 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #333;
}
</style>
