<template>
  <form class="mt-3 mb-5">
    <SettingsPresetManagement />

    <fieldset class="row mt-3">
      <fieldset class="col-sm-6">
        <legend>Hours</legend>
        <SettingsDefault mode="hours" />
      </fieldset>
      <fieldset class="col-sm-6">
        <legend>Tasks</legend>
        <SettingsDefault mode="tasks" />
      </fieldset>
    </fieldset>

    <hr />

    <button
      v-if="presetStore.currentPresetId !== 'Default'"
      type="button"
      class="btn btn-danger mt-3"
      @click="presetStore.deletePreset.mutate(presetStore.currentPresetId)"
    >
      Delete preset
      <FontAwesomeIcon v-if="presetStore.deletePreset.isPending" :icon="['fa', 'spinner']" spin></FontAwesomeIcon>
    </button>
  </form>
</template>

<script setup lang="ts">
const presetStore = usePresetStore()
</script>
