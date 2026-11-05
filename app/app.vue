<template>
  <div class="app">
    <header class="cabecalho">
      <NuxtLink to="/" class="logo">Cadastro de Demandas</NuxtLink>
      <nav class="navegacao">
        <NuxtLink to="/" :class="{ ativo: rotaAtual === '/' }">Nova Demanda</NuxtLink>
        <NuxtLink to="/consulta" :class="{ ativo: rotaAtual === '/consulta' }">Consulta</NuxtLink>
      </nav>
    </header>

    <main>
      <NuxtPage />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from '#imports'

const route = useRoute()
const rotaAtual = computed(() => route.path)
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.cabecalho {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: #1976d2;
  color: #fff;
  flex-shrink: 0;
}

.logo {
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
  text-decoration: none;
}

.navegacao {
  display: flex;
  gap: 1.5rem;
}

.navegacao a {
  color: #fff;
  text-decoration: none;
  font-size: 0.95rem;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
}

.navegacao a:hover {
  background: rgba(255, 255, 255, 0.15);
}

.navegacao a.ativo {
  background: rgba(255, 255, 255, 0.25);
  font-weight: 600;
}

main {
  flex: 1;
  padding: 2rem;
}
</style>
