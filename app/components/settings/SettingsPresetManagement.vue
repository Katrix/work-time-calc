<template>
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


