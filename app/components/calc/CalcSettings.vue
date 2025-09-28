<template>
  <form>
    <div :class="{ 'hours-settings': mode === 'hours', 'tasks-settings': mode === 'tasks' }">
      <label style="grid-area: name-description" for="nameInput">Name:</label>
      <div style="grid-area: name-content">
        <BFormInput id="nameInput" v-model="calcInfo.calc.name"></BFormInput>
      </div>

      <div :key="'modeSwitch'" style="grid-area: mode-switch" class="d-flex">
        <span class="me-2">Tasks</span>
        <BFormCheckbox :model-value="mode === 'hours'" switch @update:model-value="calcInfo.switchMode()" />
        <span>Hours</span>
      </div>

      <label v-if="mode === 'hours'" style="grid-area: saved-up-time-description" for="savedUpTimeInput">
        Saved up time:
      </label>
      <div v-if="mode === 'hours'" style="grid-area: saved-up-time-content">
        <CalcInputDuration id="savedUpTimeInput" v-model="calcInfo.calc.savedUpTime" />
      </div>

      <label v-if="mode === 'hours'" style="grid-area: saved-up-vacation-description" for="savedUpVacationInput">
        Saved up vacation days:
      </label>
      <div v-if="mode === 'hours'" style="grid-area: saved-up-vacation-content">
        <CalcInputParsed
          id="savedUpVacationInput"
          v-model="calcInfo.calc.savedUpVacation"
          :parse="(s) => Number(s.replaceAll(',', '.'))"
          :format="(v) => v.toLocaleString('en-US')"
        />
      </div>

      <label v-if="mode === 'hours'" style="grid-area: work-time-description" for="workTimeInput">Work time:</label>
      <div v-if="mode === 'hours'" style="grid-area: work-time-content">
        <CalcInputDuration id="workTimeInput" v-model="calcInfo.calc.workTime" />
      </div>

      <label v-if="mode === 'hours'" style="grid-area: default-work-from-description" for="defaultWorkFromInput">
        Default work from:
      </label>
      <div v-if="mode === 'hours'" style="grid-area: default-work-from-content">
        <CalcInputDuration id="defaultWorkFromInput" v-model="calcInfo.calc.defaultFrom" />
      </div>

      <label v-if="mode === 'hours'" style="grid-area: default-work-to-description" for="defaultWorkToInput">
        Default work to:
      </label>
      <div v-if="mode === 'hours'" style="grid-area: default-work-to-content">
        <CalcInputDuration id="defaultWorkToInput" v-model="calcInfo.calc.defaultTo" />
      </div>

      <label class="visually-hidden" for="inputFile">Input:</label>
      <div style="grid-area: input-file-content">
        <BInputGroup>
          <BFormFile
            id="inputFile"
            v-model="saveFile"
            accept="application/json"
            :directory="null as unknown as boolean"
          ></BFormFile>
          <template #append>
            <button class="btn btn-secondary" type="button" :disabled="!saveFile" @click="load()">Load</button>
            <button
              class="btn btn-secondary"
              type="button"
              :disabled="!saveFile && !calcInfo.calc.name"
              @click="save()"
            >
              Save
            </button>
            <button
              class="btn btn-secondary"
              type="button"
              :disabled="!saveFile && !calcInfo.calc.name"
              @click="saveCSV()"
            >
              Save CSV
            </button>
          </template>
        </BInputGroup>
      </div>

      <label style="grid-area: precision-description" for="precisionInput">Precision (minutes)</label>
      <div style="grid-area: precision-content">
        <BFormInput id="precisionInput" v-model.number="calcInfo.calc.precision" type="number" />
      </div>

      <span class="visually-hidden">Actions:</span>
      <div style="grid-area: actions-content" class="d-flex justify-content-between">
        <div class="btn-toolbar" role="toolbar">
          <div class="btn-group" role="group" aria-label="Actions">
            <button class="btn btn-secondary" type="button" variant="danger" @click="calcInfo.clear()">Clear</button>
            <button class="btn btn-danger" v-if="mode === 'hours'" type="button" @click="calcInfo.fillWorkdays()">
              Fill workdays
            </button>
            <button
              class="btn btn-secondary"
              v-if="mode === 'hours'"
              type="button"
              @click="calcInfo.fillRemainingWorkdays()"
            >
              Add remaining workdays
            </button>
          </div>

          <div class="btn-group mx-1" role="group" aria-label="Dangerous actions">
            <button class="btn btn-danger" type="button" @click="deleteModal = true">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <BModal v-model="deleteModal" title="Delete calc?">
      Do you want to delete the calc "{{ calcInfo.calc.name }}"?

      <template #ok>
        <BButton variant="danger" :disabled="deleting" @click="deleteCalc()">
          Yes <FontAwesomeIcon v-if="deleting" :icon="['fas', 'spinner']" spin />
        </BButton>
      </template>
    </BModal>
  </form>
</template>

<script setup lang="ts">
import { stringify as csvStringify } from 'csv-stringify/browser/esm/sync'
import type { InternalApi } from 'nitropack/types'

const props = defineProps<{ calcInfo: CalcInfo }>()
const calcStore = useCalcStore()

const deleteModal = ref(false)
const deleting = ref(false)

const mode = computed(() => props.calcInfo.calc.mode)

const saveFile = ref<File | null>(null)

function fileName(extension: string) {
  return props.calcInfo.calc.name.length
    ? `${props.calcInfo.calc.name}.${extension}`
    : (saveFile.value?.name ?? `data.${extension}`)
}

async function load() {
  const file = saveFile.value
  if (file) {
    await props.calcInfo.loadFromFile(file)
  }
}

function save() {
  // https://stackoverflow.com/questions/13405129/create-and-save-a-file-with-javascript
  const blob = new Blob([encodeCalcToString(props.calcInfo.calc)], { type: 'application/json' })
  const a = document.createElement('a')
  const url = URL.createObjectURL(blob)
  a.href = url
  a.download = fileName('json')
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 0)
}

function saveCSV() {
  const computed = props.calcInfo.computedCalc
  let computedWorkDays
  switch (props.calcInfo.calc.mode) {
    case 'hours':
      computedWorkDays = (computed?.entries ?? []).map((item) => ({
        day: item.name,
        from: item.from,
        to: item.to,
        workedTime: item.workedTime,
        extraTime: item.extraTime,
        subtractedTime: item.subtractedTime,
        notes: item.notes,
      }))
      break
    case 'tasks':
      computedWorkDays = (computed?.entries ?? []).map((item) => ({
        task: item.name,
        from: item.from,
        to: item.to,
        workedTime: item.workedTime,
        totalTime: item.extraTime,
        subtractedTime: item.subtractedTime,
        notes: item.notes,
      }))
      break
  }

  const str = csvStringify(computedWorkDays, { header: true })

  // https://stackoverflow.com/questions/13405129/create-and-save-a-file-with-javascript
  const blob = new Blob([str], { type: 'text/csv' })
  const a = document.createElement('a')
  const url = URL.createObjectURL(blob)
  a.href = url
  a.download = fileName('csv')
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 0)
}

async function deleteCalc() {
  deleting.value = true
  await calcStore.closeCalc(props.calcInfo.id)
  await $fetch<InternalApi['/api/calc/:id']['delete']>(`/api/calc/${props.calcInfo.id}`, {
    method: 'DELETE',
  })

  if (import.meta.client) {
    localStorage.removeItem(`calcs.${props.calcInfo.id}`)
  }
  deleteModal.value = false
  deleting.value = false
}
</script>
