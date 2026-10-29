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

    <a class="btn btn-secondary mt-3 me-2" href="/api/calc/exportAll">Export all as zip</a>
    <button type="button" class="btn btn-secondary mt-3 me-2" :disabled="importing" @click="importFiles()">
      Import calcs
      <FontAwesomeIcon v-if="importing" :icon="['fa', 'spinner']" spin></FontAwesomeIcon>
    </button>

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
const calcStore = useCalcStore()
const toast = useToast()

const importing = ref(false)

const { open: importFiles, onChange } = useFileDialog({ accept: '.json', multiple: true, reset: true })
onChange(async (files) => {
  if (!files || files.length === 0) {
    return
  }

  importing.value = true
  try {
    const { imported, failed } = await calcStore.importCalcs([...files])
    toast.create({ body: `Imported ${imported} calc${imported === 1 ? '' : 's'}`, variant: 'success' })
    if (failed.length) {
      toast.create({ body: `Failed to import ${failed.join(', ')}`, variant: 'danger' })
    }
  } finally {
    importing.value = false
  }
})
</script>
