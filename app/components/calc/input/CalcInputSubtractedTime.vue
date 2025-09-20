<template>
  <BInputGroup>
    <BFormInput v-model="subtractedTime" :disabled="!customSubtractedTime" />

    <template #prepend>
      <button
        class="btn btn-secondary"
        @click="
          () => {
            customSubtractedTime = !customSubtractedTime
            subtractedTime = null
          }
        "
      >
        <ClientOnly>
          <FontAwesomeLayers fixed-width>
            <FontAwesomeIcon v-if="!customSubtractedTime" :icon="['fas', 'slash']" transform="down-1 left-1" />
            <FontAwesomeIcon v-if="!customSubtractedTime" :icon="['fas', 'slash']" :mask="['fas', 'pen-to-square']" />
            <FontAwesomeIcon v-if="customSubtractedTime" :icon="['fas', 'pen-to-square']" />
          </FontAwesomeLayers>
        </ClientOnly>
      </button>
    </template>
  </BInputGroup>
</template>

<script setup lang="ts">
const subtractedTime = defineModel<string | null>('subtractedTime', { required: true })
const customSubtractedTime = defineModel<boolean | undefined>('customSubtractedTime', { required: true })
</script>
