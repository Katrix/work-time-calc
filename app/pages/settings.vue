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

    <!-- <button type="button" class="btn btn-secondary mt-3 me-2" @click="exportAll">Export all as zip</button> -->
    <button type="button" class="btn btn-secondary mt-3 me-2" :disabled="importing" @click="importFiles">
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
// import { strToU8, zipSync } from 'fflate'

const presetStore = usePresetStore()
const calcStore = useCalcStore()
const toast = useToast()

const importing = ref(false)

function importFiles() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.multiple = true
  input.onchange = async (e) => {
    const files = [...((e.target as HTMLInputElement).files ?? [])]
    if (!files.length) {
      return
    }

    importing.value = true
    try {
      const { imported, failed } = await calcStore.importCalcs(files)
      toast.create({ body: `Imported ${imported} calc${imported === 1 ? '' : 's'}`, variant: 'success' })
      if (failed.length) {
        toast.create({ body: `Failed to import ${failed.join(', ')}`, variant: 'danger' })
      }
    } finally {
      importing.value = false
    }
  }
  input.click()
}

/* TODO: Reimplement later
function exportAll() {
  const files: Record<string, Uint8Array> = {}
  // Iterate over all calcs, not just calcOrder, so that closed calcs are included
  for (const [idx, [calcId, { entry }]] of [...calcStore.calcs.entries()].entries()) {
    const calc = entry.value
    const baseName = calcStore.calcName(calcId, idx).replace(/[/\\]/g, '_')
    let name = `${baseName}.json`
    for (let i = 2; name in files; i++) {
      name = `${baseName} (${i}).json`
    }
    files[name] = strToU8(encodeCalcToString(calc))
  }

  // https://stackoverflow.com/questions/13405129/create-and-save-a-file-with-javascript
  const blob = new Blob([zipSync(files)], { type: 'application/zip' })
  const a = document.createElement('a')
  const url = URL.createObjectURL(blob)
  a.href = url
  a.download = 'work-time-calcs.zip'
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 0)
}
*/
</script>
