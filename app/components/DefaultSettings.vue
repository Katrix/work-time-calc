<template>
  <form>
    <div>
      <label v-if="mode === 'hours'" for="workTimeInput">Work time:</label>
      <div v-if="mode === 'hours'">
        <BFormInput id="workTimeInput" v-model="settingsStore.workTime"></BFormInput>
      </div>

      <label v-if="mode === 'hours'" for="defaultWorkFromInput">Default work from:</label>
      <div v-if="mode === 'hours'">
        <BFormInput id="defaultWorkFromInput" v-model="settingsStore.defaultFrom"></BFormInput>
      </div>

      <label v-if="mode === 'hours'" for="defaultWorkToInput">Default work to:</label>
      <div v-if="mode === 'hours'">
        <BFormInput id="defaultWorkToInput" v-model="settingsStore.defaultTo"></BFormInput>
      </div>

      <label style="grid-area: precision-description" for="precisionInput">Precision (minutes)</label>
      <div style="grid-area: precision-content">
        <BFormInput id="precisionInput" v-model="settingsStore.precision" type="number" />
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
const props = defineProps<{ mode: 'hours' | 'tasks' }>()

const settingsStore = computed(() => useSettingsStore(`default-${props.mode}`, props.mode))
</script>
