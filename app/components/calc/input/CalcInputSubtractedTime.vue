<template>
  <BInputGroup>
    <CalcInputDuration v-model="subtractedTime" :disabled="subtractedTime === null" />

    <template #prepend>
      <button class="btn btn-secondary" @click="toggleSubtractedTime">
        <ClientOnly>
          <FontAwesomeLayers fixed-width>
            <FontAwesomeIcon v-if="subtractedTime === null" :icon="['fas', 'slash']" transform="down-1 left-1" />
            <FontAwesomeIcon v-if="subtractedTime === null" :icon="['fas', 'slash']" :mask="['fas', 'pen-to-square']" />
            <FontAwesomeIcon v-if="subtractedTime !== null" :icon="['fas', 'pen-to-square']" />
          </FontAwesomeLayers>
        </ClientOnly>
      </button>
    </template>
  </BInputGroup>
</template>

<script setup lang="ts">
const subtractedTime = defineModel<number | undefined | null>({ required: true })

const presetStore = usePresetStore()

function toggleSubtractedTime() {
  if (subtractedTime.value === null) {
    subtractedTime.value = presetStore.currentPreset.hours.workTime
  } else {
    subtractedTime.value = null
  }
}
</script>
