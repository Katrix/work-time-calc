<template>
  <fieldset>
    <label v-if="mode === 'hours'" for="workTimeInput">Work time:</label>
    <div v-if="mode === 'hours'">
      <BFormInput
        id="workTimeInput"
        v-model="presetStore.currentPreset[mode].workTime"
        @change="markModeUpdates"
      ></BFormInput>
    </div>

    <label v-if="mode === 'hours'" for="defaultWorkFromInput">Default work from:</label>
    <div v-if="mode === 'hours'">
      <BFormInput
        id="defaultWorkFromInput"
        v-model="presetStore.currentPreset[mode].defaultFrom"
        @change="markModeUpdates"
      ></BFormInput>
    </div>

    <label v-if="mode === 'hours'" for="defaultWorkToInput">Default work to:</label>
    <div v-if="mode === 'hours'">
      <BFormInput
        id="defaultWorkToInput"
        v-model="presetStore.currentPreset[mode].defaultTo"
        @change="markModeUpdates"
      ></BFormInput>
    </div>

    <label for="precisionInput">Precision (minutes)</label>
    <div>
      <BFormInput
        id="precisionInput"
        v-model="presetStore.currentPreset[mode].precision"
        type="number"
        @change="markModeUpdates"
      />
    </div>
  </fieldset>

  <hr />

  <SettingsHolidays v-if="mode === 'hours'" />
  <SettingsGithub v-if="mode === 'tasks'" />
</template>

<script setup lang="ts">
defineProps<{ mode: 'hours' | 'tasks' }>()
const presetStore = usePresetStore()

function markModeUpdates() {
  presetStore.markUpdate(presetStore.currentPresetId, 'settings')
}
</script>
