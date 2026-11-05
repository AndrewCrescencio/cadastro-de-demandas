<template>
  <form @submit.prevent="onSubmit" class="demanda-form">
    <div class="campo">
      <label for="dataSolicitacao">Data de Solicitação <span class="obrigatorio">*</span></label>
      <input
        id="dataSolicitacao"
        type="text"
        inputmode="numeric"
        maxlength="10"
        placeholder="DD/MM/AAAA"
        v-model="dataSolicitacao"
        @input="onInput"
        @blur="validarData"
        :class="{ invalido: erroData || erroServidor }"
      />
      <span class="erro" v-if="erroData">{{ erroData }}</span>
      <span class="erro servidor" v-if="erroServidor">{{ erroServidor }}</span>
    </div>

    <button type="submit" :disabled="carregando">
      {{ carregando ? 'Enviando…' : 'Cadastrar' }}
    </button>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { parseDataBrasileira, hojeISO } from '#shared/utils/data'

const emit = defineEmits(['submit'])

const dataSolicitacao = ref('')
const erroData = ref('')
const erroServidor = ref('')
const carregando = ref(false)

/**
 * Máscara manual DD/MM/AAAA: insere barras nas posições 2 e 5,
 * descarta não-números e limita a 8 dígitos.
 */
function aplicarMascara(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 8)

  if (digitos.length <= 2) return digitos
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`
}

function onInput(event: Event) {
  const input = event.target as HTMLInputElement
  const proximo = aplicarMascara(input.value)
  dataSolicitacao.value = proximo
  input.value = proximo
}

/**
 * Converte DD/MM/AAAA valida para YYYY-MM-DD, seguindo o mesmo padrão
 * de comparação ISO como texto usado pelo servidor.
 */
function paraISO(valor: string): string | null {
  const data = parseDataBrasileira(valor)
  if (!data) return null

  const y = data.getFullYear()
  const m = String(data.getMonth() + 1).padStart(2, '0')
  const d = String(data.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Validação de UX no cliente (feedback imediato). O servidor continua
 * sendo a validação definitiva (422).
 */
function validarData(): boolean {
  erroData.value = ''
  const valor = dataSolicitacao.value.trim()

  if (!valor) {
    erroData.value = 'Data de solicitação é obrigatória'
    return false
  }

  if (parseDataBrasileira(valor) === null) {
    erroData.value =
      'Data de solicitação deve estar no formato DD/MM/AAAA e ser uma data válida'
    return false
  }

  const iso = paraISO(valor)
  if (iso && iso > hojeISO()) {
    erroData.value = 'Data de solicitação não pode ser futura'
    return false
  }

  return true
}

async function onSubmit() {
  const valido = validarData()
  if (!valido) return

  erroServidor.value = ''
  carregando.value = true

  try {
    const resposta = await $fetch('/api/demandas', {
      method: 'POST',
      // Valor enviado exatamente como está no input (texto cru DD/MM/AAAA),
      // sem conversão de formato. A prioridade é calculada pelo servidor.
      body: { dataSolicitacao: dataSolicitacao.value },
    })
    emit('submit', resposta)
  } catch (erro: unknown) {
    // 422 do servidor vem com [{ campo, mensagem }, ...]
    const data = (erro as { data?: unknown })?.data
    if (data && Array.isArray(data)) {
      const erroServidorData = data.find((e: { campo?: string; mensagem?: string }) => e.campo === 'dataSolicitacao')
      if (erroServidorData?.mensagem) {
        erroServidor.value = erroServidorData.mensagem
      }
    }
  } finally {
    carregando.value = false
  }
}
</script>

<style scoped>
.demanda-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 400px;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

label {
  font-weight: 600;
  font-size: 0.95rem;
}

.obrigatorio {
  color: #d32f2f;
}

input[type='text'] {
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

input.invalido {
  border-color: #d32f2f;
}

.erro {
  font-size: 0.8rem;
  color: #d32f2f;
}

button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  background: #1976d2;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
