<template>
  <form>
    <div :class="{ 'hours-settings': mode === 'hours', 'tasks-settings': mode === 'tasks' }">
      <label style="grid-area: name-description" for="nameInput">Name:</label>
      <div style="grid-area: name-content">
        <BFormInput id="nameInput" v-model="calc.name"></BFormInput>
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
        <BFormInput id="savedUpTimeInput" v-model="calc.savedUpTime"></BFormInput>
      </div>

      <label v-if="mode === 'hours'" style="grid-area: saved-up-vacation-description" for="savedUpVacationInput"
        >Saved up vacation days:</label
      >
      <div v-if="mode === 'hours'" style="grid-area: saved-up-vacation-content">
        <BFormInput id="savedUpVacationInput" v-model="calc.savedUpVacation"></BFormInput>
      </div>

      <label v-if="mode === 'hours'" style="grid-area: work-time-description" for="workTimeInput">Work time:</label>
      <div v-if="mode === 'hours'" style="grid-area: work-time-content">
        <BFormInput id="workTimeInput" v-model="calc.workTime"></BFormInput>
      </div>

      <label v-if="mode === 'hours'" style="grid-area: default-work-from-description" for="defaultWorkFromInput"
        >Default work from:</label
      >
      <div v-if="mode === 'hours'" style="grid-area: default-work-from-content">
        <BFormInput id="defaultWorkFromInput" v-model="calc.defaultFrom"></BFormInput>
      </div>

      <label v-if="mode === 'hours'" style="grid-area: default-work-to-description" for="defaultWorkToInput"
        >Default work to:</label
      >
      <div v-if="mode === 'hours'" style="grid-area: default-work-to-content">
        <BFormInput id="defaultWorkToInput" v-model="calc.defaultTo"></BFormInput>
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
            <button
              class="btn btn-secondary"
              type="button"
              :disabled="!saveFile"
              @click="$emit('load', saveFile as File)"
            >
              Load
            </button>
            <button
              class="btn btn-secondary"
              type="button"
              :disabled="!saveFile && !calc.name"
              @click="$emit('save', saveFile as File)"
            >
              Save
            </button>
            <button
              class="btn btn-secondary"
              type="button"
              :disabled="!saveFile && !calc.name"
              @click="$emit('saveCsv', saveFile as File)"
            >
              Save CSV
            </button>
          </template>
        </BInputGroup>
      </div>

      <label style="grid-area: precision-description" for="precisionInput">Precision (minutes)</label>
      <div style="grid-area: precision-content">
        <BFormInput id="precisionInput" v-model="calc.precision" type="number" />
      </div>

      <span class="visually-hidden">Actions:</span>
      <div style="grid-area: actions-content" class="d-flex justify-content-between">
        <div class="btn-toolbar" role="toolbar">
          <div class="btn-group" role="group" aria-label="Actions">
            <button class="btn btn-secondary" type="button" variant="danger" @click="calcClear()">Clear</button>
            <button class="btn btn-danger" v-if="mode === 'hours'" type="button" @click="fillWorkdays()">
              Fill workdays
            </button>
            <button class="btn btn-secondary" v-if="mode === 'hours'" type="button" @click="fillRemainingWorkdays()">
              Add remaining workdays
            </button>
          </div>
        </div>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
const props = defineProps<{ storeId: string }>()

const calcStore = useCalcStore()
const {
  calc,
  switchMode,
  clear: calcClear,
  fillWorkdays,
  fillRemainingWorkdays,
} = calcStore.useCalc(computed(() => props.storeId))
const mode = computed(() => calc.value.mode)

const saveFile = computed<File | null, File>({
  get: () => calcStore.saveFiles.get(props.storeId) ?? null,
  set: (value) => calcStore.saveFiles.set(props.storeId, value),
})

defineEmits<{
  load: [File]
  save: [File]
  saveCsv: [File]
}>()
</script>
