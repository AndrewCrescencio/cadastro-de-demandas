<template>
  <div class="pagina">
    <h1>Consulta de Demandas</h1>
    <DemandaList />
  </div>
</template>

<script setup>
import DemandaList from '~/components/DemandaList.vue'

definePageMeta({
  title: 'Consulta de Demandas',
})
</script>

<style scoped>
.pagina {
  max-width: 960px;
  margin: 2rem auto;
  padding: 0 1rem;
}

h1 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #333;
}
</style>
