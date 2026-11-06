<template>
  <form class="demanda-form" data-cy="demanda-form" @submit.prevent="onSubmit">
    <div class="campo">
      <label for="titulo">Título <span class="obrigatorio">*</span></label>
      <input
        id="titulo"
        v-model="titulo"
        data-cy="input-titulo"
        type="text"
        maxlength="150"
        :class="{ invalido: erroTitulo || erroServidorTitulo }"
        :placeholder="`Máximo ${LIMITES.TITULO_MAX_CHARS} caracteres`"
        @input="onInputTitulo"
        @blur="validarTitulo"
      />
      <span class="contador">{{ titulo.length }} / {{ LIMITES.TITULO_MAX_CHARS }}</span>
      <span v-if="erroTitulo" class="erro" data-cy="erro-titulo">{{ erroTitulo }}</span>
      <span v-if="erroServidorTitulo" class="erro servidor" data-cy="erro-servidor-titulo">{{
        erroServidorTitulo
      }}</span>
    </div>

    <div class="campo">
      <label for="descricao">Descrição <span class="obrigatorio">*</span></label>
      <textarea
        id="descricao"
        v-model="descricao"
        data-cy="input-descricao"
        :class="{ invalido: erroDescricao || erroServidorDescricao }"
        :placeholder="`Máximo ${LIMITES.DESCRICAO_MAX_CHARS} caracteres`"
        rows="4"
        @input="onInputDescricao"
        @blur="validarDescricao"
      ></textarea>
      <span class="contador">{{ descricao.length }} / {{ LIMITES.DESCRICAO_MAX_CHARS }}</span>
      <span v-if="erroDescricao" class="erro" data-cy="erro-descricao">{{ erroDescricao }}</span>
      <span v-if="erroServidorDescricao" class="erro servidor" data-cy="erro-servidor-descricao">{{
        erroServidorDescricao
      }}</span>
    </div>

    <div class="campo">
      <label for="dataSolicitacao">Data de Solicitação <span class="obrigatorio">*</span></label>
      <input
        id="dataSolicitacao"
        v-model="dataSolicitacao"
        data-cy="input-data"
        type="text"
        inputmode="numeric"
        maxlength="10"
        placeholder="DD/MM/AAAA"
        :class="{ invalido: erroData || erroServidorData }"
        @input="onInputData"
        @blur="validarData"
      />
      <span v-if="erroData" class="erro" data-cy="erro-data">{{ erroData }}</span>
      <span v-if="erroServidorData" class="erro servidor" data-cy="erro-servidor-data">{{
        erroServidorData
      }}</span>
    </div>

    <div class="campo">
      <label for="setor">Setor <span class="obrigatorio">*</span></label>
      <select
        id="setor"
        v-model="setor"
        data-cy="select-setor"
        :class="{ invalido: erroSetor || erroServidorSetor }"
        @blur="validarSetor"
      >
        <option value="">Selecione um setor</option>
        <option v-for="s in SETORES_PERMITIDOS" :key="s" :value="s">{{ s }}</option>
      </select>
      <span v-if="erroSetor" class="erro" data-cy="erro-setor">{{ erroSetor }}</span>
      <span v-if="erroServidorSetor" class="erro servidor" data-cy="erro-servidor-setor">{{
        erroServidorSetor
      }}</span>
    </div>

    <div class="campo">
      <label for="status">Status <span class="obrigatorio">*</span></label>
      <select
        id="status"
        v-model="status"
        data-cy="select-status"
        :class="{ invalido: erroStatus || erroServidorStatus }"
        @blur="validarStatus"
      >
        <option value="">Selecione um status</option>
        <option v-for="st in STATUS_PERMITIDOS" :key="st" :value="st">{{ st }}</option>
      </select>
      <span v-if="erroStatus" class="erro" data-cy="erro-status">{{ erroStatus }}</span>
      <span v-if="erroServidorStatus" class="erro servidor" data-cy="erro-servidor-status">{{
        erroServidorStatus
      }}</span>
    </div>

    <button type="submit" data-cy="btn-submit" :disabled="carregando">
      {{ carregando ? 'Enviando…' : 'Cadastrar demanda' }}
    </button>
  </form>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  parseDataBrasileira,
  hojeISO,
  LIMITES,
  STATUS_PERMITIDOS,
  SETORES_PERMITIDOS,
} from '#shared/utils/data'

const emit = defineEmits(['submit'])

const titulo = ref('')
const descricao = ref('')
const dataSolicitacao = ref('')
const setor = ref('')
const status = ref('')

const erroTitulo = ref('')
const erroDescricao = ref('')
const erroData = ref('')
const erroSetor = ref('')
const erroStatus = ref('')

const erroServidorTitulo = ref('')
const erroServidorDescricao = ref('')
const erroServidorData = ref('')
const erroServidorSetor = ref('')
const erroServidorStatus = ref('')

const carregando = ref(false)

function aplicarMascara(valor) {
  const digitos = valor.replace(/\D/g, '').slice(0, 8)

  if (digitos.length <= 2) return digitos
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`
}

function onInputTitulo(event) {
  const input = event.target
  const proximo = input.value.trim()
  titulo.value = proximo
  input.value = proximo
}

function onInputDescricao(event) {
  const textarea = event.target
  descricao.value = textarea.value.trim()
  textarea.value = descricao.value
}

function onInputData(event) {
  const input = event.target
  const proximo = aplicarMascara(input.value)
  dataSolicitacao.value = proximo
  input.value = proximo
}

function paraISO(valor) {
  const data = parseDataBrasileira(valor)
  if (!data) return null

  const y = data.getFullYear()
  const m = String(data.getMonth() + 1).padStart(2, '0')
  const d = String(data.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function validarTitulo() {
  erroTitulo.value = ''
  const valor = titulo.value.trim()
  if (!valor) {
    erroTitulo.value = 'Título é obrigatório'
    return false
  }
  if (valor.length > LIMITES.TITULO_MAX_CHARS) {
    erroTitulo.value = `Título não pode exceder ${LIMITES.TITULO_MAX_CHARS} caracteres`
    return false
  }
  return true
}

function validarDescricao() {
  erroDescricao.value = ''
  const valor = descricao.value.trim()
  if (!valor) {
    erroDescricao.value = 'Descrição é obrigatória'
    return false
  }
  if (valor.length > LIMITES.DESCRICAO_MAX_CHARS) {
    erroDescricao.value = `Descrição não pode exceder ${LIMITES.DESCRICAO_MAX_CHARS} caracteres`
    return false
  }
  return true
}

function validarData() {
  erroData.value = ''
  const valor = dataSolicitacao.value.trim()
  if (!valor) {
    erroData.value = 'Data de solicitação é obrigatória'
    return false
  }
  if (parseDataBrasileira(valor) === null) {
    erroData.value = 'Data de solicitação deve estar no formato DD/MM/AAAA e ser uma data válida'
    return false
  }
  const iso = paraISO(valor)
  if (iso && iso > hojeISO()) {
    erroData.value = 'Data de solicitação não pode ser futura'
    return false
  }
  return true
}

function validarSetor() {
  erroSetor.value = ''
  if (!setor.value) {
    erroSetor.value = 'Setor é obrigatório'
    return false
  }
  return true
}

function validarStatus() {
  erroStatus.value = ''
  if (!status.value) {
    erroStatus.value = 'Status é obrigatório'
    return false
  }
  return true
}

const formValido = computed(() => {
  validarTitulo()
  validarDescricao()
  validarData()
  validarSetor()
  validarStatus()
  return !(
    erroTitulo.value ||
    erroDescricao.value ||
    erroData.value ||
    erroSetor.value ||
    erroStatus.value
  )
})

async function onSubmit() {
  if (!formValido.value) return

  erroServidorTitulo.value = ''
  erroServidorDescricao.value = ''
  erroServidorData.value = ''
  erroServidorSetor.value = ''
  erroServidorStatus.value = ''

  carregando.value = true

  try {
    const resposta = await $fetch('/api/demandas', {
      method: 'POST',
      body: {
        titulo: titulo.value,
        descricao: descricao.value,
        dataSolicitacao: dataSolicitacao.value,
        setor: setor.value,
        status: status.value,
      },
    })
    emit('submit', resposta)
  } catch (erro) {
    const data = erro?.data
    if (data && Array.isArray(data)) {
      data.forEach((e) => {
        if (e.campo === 'titulo') erroServidorTitulo.value = e.mensagem || ''
        if (e.campo === 'descricao') erroServidorDescricao.value = e.mensagem || ''
        if (e.campo === 'dataSolicitacao') erroServidorData.value = e.mensagem || ''
        if (e.campo === 'setor') erroServidorSetor.value = e.mensagem || ''
        if (e.campo === 'status') erroServidorStatus.value = e.mensagem || ''
      })
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
  max-width: 480px;
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

input[type='text'],
textarea,
select {
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: inherit;
}

textarea {
  resize: vertical;
  min-height: 90px;
}

input.invalido,
textarea.invalido,
select.invalido {
  border-color: #d32f2f;
}

.contador {
  font-size: 0.75rem;
  color: #666;
  align-self: flex-end;
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
  margin-top: 0.5rem;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
