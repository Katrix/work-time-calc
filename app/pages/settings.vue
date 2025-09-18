<template>
  <form class="mt-3">
    <BFormGroup label="New preset">
      <BInputGroup>
        <BFormInput type="text" v-model="newPresetName" />
        <template #append>
          <button type="button" class="btn btn-secondary" @click="newPreset">Create</button>
        </template>
      </BInputGroup>
    </BFormGroup>

    <hr />

    <div class="row">
      <div class="col-6">
        <BFormGroup label="Preset">
          <BFormSelect
            v-model="presetStore.currentPresetId"
            :options="[...presetStore.presets.keys()]"
            @change="resetPresetName"
          />
        </BFormGroup>
      </div>
      <div class="col-6">
        <BFormGroup v-if="presetStore.currentPresetId !== 'Default'" label="Name">
          <BInputGroup>
            <BFormInput type="text" v-model="renamePresetName" />
            <template #append>
              <button
                type="button"
                class="btn btn-secondary"
                @click="presetStore.renamePreset({ from: presetStore.currentPresetId, to: renamePresetName })"
              >
                Rename
              </button>
            </template>
          </BInputGroup>
        </BFormGroup>
      </div>
    </div>

    <div class="row mt-3">
      <div class="col-6">
        <h2>Hours</h2>
        <DefaultSettings mode="hours" />
      </div>
      <div class="col-6">
        <h2>Tasks</h2>
        <DefaultSettings mode="tasks" />
      </div>
    </div>

    <button
      v-if="presetStore.currentPresetId !== 'Default'"
      type="button"
      class="btn btn-danger mt-3"
      @click="presetStore.deletePreset(presetStore.currentPresetId)"
    >
      Delete preset
    </button>
  </form>
</template>

<script setup lang="ts">
const presetStore = usePresetStore()
const newPresetName = ref('')
const renamePresetName = ref(presetStore.currentPresetId)

function resetPresetName() {
  renamePresetName.value = presetStore.currentPresetId
}

function newPreset() {
  presetStore.newPreset(newPresetName.value)
  presetStore.currentPresetId = newPresetName.value
  newPresetName.value = ''
  resetPresetName()
}
</script>
