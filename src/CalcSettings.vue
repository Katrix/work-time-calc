<template>
  <BForm>
    <div :class="{ 'hours-settings': mode === 'hours', 'tasks-settings': mode === 'tasks' }">
      <label style="grid-area: name-description" for="nameInput">Name:</label>
      <div style="grid-area: name-content">
        <BFormInput id="nameInput" v-model="nameInput"></BFormInput>
      </div>

      <div :key="'modeSwitch'" style="grid-area: mode-switch" class="d-flex">
        <span class="me-2">Tasks</span>
        <BFormCheckbox :model-value="mode === 'hours'" switch @update:model-value="switchMode()"></BFormCheckbox>
        <span>Hours</span>
      </div>

      <label v-if="mode === 'hours'" style="grid-area: saved-up-time-description" for="savedUpTimeInput"
        >Saved up time:</label
      >
      <div v-if="mode === 'hours'" style="grid-area: saved-up-time-content">
        <BFormInput id="savedUpTimeInput" v-model="savedUpTime"></BFormInput>
      </div>

      <label v-if="mode === 'hours'" style="grid-area: saved-up-vacation-description">Saved up vacation days:</label>
      <div v-if="mode === 'hours'" style="grid-area: saved-up-vacation-content">
        <BFormInput id="savedUpVacationInput" v-model="savedUpVacation"></BFormInput>
      </div>

      <label v-if="mode === 'hours'" style="grid-area: work-time-description" for="workTimeInput">Work time:</label>
      <div v-if="mode === 'hours'" style="grid-area: work-time-content">
        <BFormInput id="workTimeInput" v-model="workTime"></BFormInput>
      </div>

      <label v-if="mode === 'hours'" style="grid-area: default-work-from-description" for="defaultWorkFromInput"
        >Default work from:</label
      >
      <div v-if="mode === 'hours'" style="grid-area: default-work-from-content">
        <BFormInput id="defaultWorkFromInput" v-model="defaultFrom"></BFormInput>
      </div>

      <label v-if="mode === 'hours'" style="grid-area: default-work-to-description" for="defaultWorkToInput"
        >Default work to:</label
      >
      <div v-if="mode === 'hours'" style="grid-area: default-work-to-content">
        <BFormInput id="defaultWorkToInput" v-model="defaultTo"></BFormInput>
      </div>

      <label style="grid-area: input-file-description" for="inputFile">Input:</label>
      <div style="grid-area: input-file-content">
        <BInputGroup>
          <BFormFile id="inputFile" v-model="saveFile" accept="application/json"></BFormFile>
          <template #append>
            <BButton type="button" :disabled="!saveFile" @click="$emit('load', saveFile as File)">Load</BButton>
            <BButton type="button" :disabled="!saveFile && !nameInput" @click="$emit('save', saveFile as File)">Save</BButton>
            <BButton type="button" :disabled="!saveFile && !nameInput" @click="$emit('saveCsv', saveFile as File)">Save CSV</BButton>
          </template>
        </BInputGroup>
      </div>

      <span style="grid-area: actions-description">Actions:</span>
      <div style="grid-area: actions-content" class="d-flex justify-content-between">
        <BButtonToolbar>
          <BButtonGroup>
            <BButton type="button" variant="danger" @click="$emit('clear')">Clear</BButton>
            <BButton v-if="mode === 'hours'" type="button" variant="danger" @click="$emit('fillWorkdays')">
              Fill workdays
            </BButton>
            <BButton v-if="mode === 'hours'" type="button" @click="$emit('fillRemainingWorkdays')">
              Add remaining workdays
            </BButton>
          </BButtonGroup>
        </BButtonToolbar>
      </div>

      <label style="grid-area: granularity-description" for="granularityInput">Granularity (minutes)</label>
      <div style="grid-area: granularity-content">
        <BFormInput id="granularityInput" v-model="granularity" type="number" />
      </div>
    </div>
  </BForm>
</template>

<script setup lang="ts">
import {
  BButton,
  BButtonGroup,
  BButtonToolbar,
  BForm,
  BFormCheckbox,
  BFormFile,
  BFormInput,
  BInputGroup,
} from 'bootstrap-vue-next'
import { ref } from 'vue'

const mode = ref<'hours' | 'tasks'>('hours')
const nameInput = ref('')
const savedUpTime = ref('00:00')
const savedUpVacation = ref('0')
const workTime = ref('08:00')
const defaultFrom = ref('08:45')
const defaultTo = ref('17:00')
const saveFile = ref<null | File>(null)
const granularity = ref(5)

defineEmits<{
  load: [File]
  save: [File]
  saveCsv: [File]
  clear: []
  fillWorkdays: []
  fillRemainingWorkdays: []
}>()

function loadData(data: {
  mode: 'hours' | 'tasks'
  name: string
  savedUpTime: string
  savedUpVacation: string
  workTime: string
  defaultFrom: string
  defaultTo: string
}) {
  mode.value = data.mode
  nameInput.value = data.name
  savedUpTime.value = data.savedUpTime
  savedUpVacation.value = data.savedUpVacation
  workTime.value = data.workTime
  defaultFrom.value = data.defaultFrom
  defaultTo.value = data.defaultTo
}

defineExpose({
  mode,
  nameInput,
  savedUpTime,
  savedUpVacation,
  workTime,
  defaultFrom,
  defaultTo,
  saveFile,
  loadData,
  granularity
})

function setModeHours() {
  mode.value = 'hours'
  workTime.value = '08:00'
  defaultFrom.value = '08:45'
  defaultTo.value = '17:00'
}

function setModeTasks() {
  mode.value = 'tasks'
  workTime.value = '00:00'
  defaultFrom.value = '00:00'
  defaultTo.value = '00:00'
}

function switchMode() {
  if (mode.value === 'hours') {
    setModeTasks()
  } else {
    setModeHours()
  }
}
</script>
