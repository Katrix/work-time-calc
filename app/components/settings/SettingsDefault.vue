<template>
  <fieldset>
    <label v-if="mode === 'hours'" for="workTimeInput">Work time:</label>
    <div v-if="mode === 'hours'">
      <CalcInputDuration
        id="workTimeInput"
        v-model="presetStore.currentPreset[mode].workTime"
        @update:model-value="markModeUpdates"
      />
    </div>

    <label v-if="mode === 'hours'" for="defaultWorkFromInput">Default work from:</label>
    <div v-if="mode === 'hours'">
      <CalcInputDuration
        id="defaultWorkFromInput"
        v-model="presetStore.currentPreset[mode].defaultFrom"
        @update:model-value="markModeUpdates"
      />
    </div>

    <label v-if="mode === 'hours'" for="defaultWorkToInput">Default work to:</label>
    <div v-if="mode === 'hours'">
      <CalcInputDuration
        id="defaultWorkToInput"
        v-model="presetStore.currentPreset[mode].defaultTo"
        @update:model-value="markModeUpdates"
      />
    </div>

    <label for="precisionInput">Precision (minutes)</label>
    <div>
      <BFormInput
        id="precisionInput"
        v-model.number="presetStore.currentPreset[mode].precision"
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
  console.log('Marking updates')
  presetStore.markUpdate(presetStore.currentPresetId, 'settings')
}
</script>
