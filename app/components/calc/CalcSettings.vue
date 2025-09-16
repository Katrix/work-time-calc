<template>
  <BForm>
    <div :class="{ 'hours-settings': mode === 'hours', 'tasks-settings': mode === 'tasks' }">
      <label style="grid-area: name-description" for="nameInput">Name:</label>
      <div style="grid-area: name-content">
        <BFormInput id="nameInput" v-model="settingsStore.nameInput"></BFormInput>
      </div>

      <div :key="'modeSwitch'" style="grid-area: mode-switch" class="d-flex">
        <span class="me-2">Tasks</span>
        <BFormCheckbox
          :model-value="mode === 'hours'"
          switch
          @update:model-value="settingsStore.switchMode()"
        ></BFormCheckbox>
        <span>Hours</span>
      </div>

      <label v-if="mode === 'hours'" style="grid-area: saved-up-time-description" for="savedUpTimeInput"
        >Saved up time:</label
      >
      <div v-if="mode === 'hours'" style="grid-area: saved-up-time-content">
        <BFormInput id="savedUpTimeInput" v-model="settingsStore.savedUpTime"></BFormInput>
      </div>

      <label v-if="mode === 'hours'" style="grid-area: saved-up-vacation-description">Saved up vacation days:</label>
      <div v-if="mode === 'hours'" style="grid-area: saved-up-vacation-content">
        <BFormInput id="savedUpVacationInput" v-model="settingsStore.savedUpVacation"></BFormInput>
      </div>

      <label v-if="mode === 'hours'" style="grid-area: work-time-description" for="workTimeInput">Work time:</label>
      <div v-if="mode === 'hours'" style="grid-area: work-time-content">
        <BFormInput id="workTimeInput" v-model="settingsStore.workTime"></BFormInput>
      </div>

      <label v-if="mode === 'hours'" style="grid-area: default-work-from-description" for="defaultWorkFromInput"
        >Default work from:</label
      >
      <div v-if="mode === 'hours'" style="grid-area: default-work-from-content">
        <BFormInput id="defaultWorkFromInput" v-model="settingsStore.defaultFrom"></BFormInput>
      </div>

      <label v-if="mode === 'hours'" style="grid-area: default-work-to-description" for="defaultWorkToInput"
        >Default work to:</label
      >
      <div v-if="mode === 'hours'" style="grid-area: default-work-to-content">
        <BFormInput id="defaultWorkToInput" v-model="settingsStore.defaultTo"></BFormInput>
      </div>

      <label class="visually-hidden" for="inputFile">Input:</label>
      <div style="grid-area: input-file-content">
        <BInputGroup>
          <BFormFile id="inputFile" v-model="settingsStore.saveFile" accept="application/json" :directory="null"></BFormFile>
          <template #append>
            <BButton
              type="button"
              :disabled="!settingsStore.saveFile"
              @click="$emit('load', settingsStore.saveFile as File)"
              >Load</BButton
            >
            <BButton
              type="button"
              :disabled="!settingsStore.saveFile && !settingsStore.nameInput"
              @click="$emit('save', settingsStore.saveFile as File)"
              >Save</BButton
            >
            <BButton
              type="button"
              :disabled="!settingsStore.saveFile && !settingsStore.nameInput"
              @click="$emit('saveCsv', settingsStore.saveFile as File)"
              >Save CSV</BButton
            >
          </template>
        </BInputGroup>
      </div>

      <label style="grid-area: precision-description" for="precisionInput">Precision (minutes)</label>
      <div style="grid-area: precision-content">
        <BFormInput id="precisionInput" v-model="settingsStore.precision" type="number" />
      </div>

      <span class="visually-hidden">Actions:</span>
      <div style="grid-area: actions-content" class="d-flex justify-content-between">
        <BButtonToolbar>
          <BButtonGroup>
            <BButton type="button" variant="danger" @click="entriesStore.clear()">Clear</BButton>
            <BButton v-if="mode === 'hours'" type="button" variant="danger" @click="entriesStore.fillWorkdays()">
              Fill workdays
            </BButton>
            <BButton v-if="mode === 'hours'" type="button" @click="entriesStore.fillRemainingWorkdays()">
              Add remaining workdays
            </BButton>
          </BButtonGroup>
        </BButtonToolbar>
      </div>
    </div>
  </BForm>
</template>

<script setup lang="ts">
const props = defineProps<{ storeId: string }>()

const settingsStore = computed(() => useSettingsStore(props.storeId))
const entriesStore = computed(() => useEntriesStore(props.storeId))
const mode = computed(() => settingsStore.value.mode)

defineEmits<{
  load: [File]
  save: [File]
  saveCsv: [File]
}>()
</script>
