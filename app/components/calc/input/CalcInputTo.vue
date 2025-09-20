<template>
  <BInputGroup>
    <BFormInput v-model="to" :disabled="isTracking" />
    <template #append>
      <button class="btn btn-secondary" @click="to = currentTime(precision)">
        <FontAwesomeIcon :icon="['fas', 'clock']" />
      </button>
      <button
        class="btn btn-secondary"
        v-if="!isTracking && (to ?? '') === ''"
        @click="
          () => {
            to = currentTime(precision)
            isTracking = true
          }
        "
      >
        <FontAwesomeIcon :icon="['fas', 'hourglass-start']" />
      </button>
      <button class="btn btn-primary" v-else-if="isTracking" @click="isTracking = false">
        <FontAwesomeIcon :icon="['fas', 'hourglass-half']" />
      </button>
      <button class="btn btn-secondary" v-else disabled>
        <FontAwesomeIcon :icon="['fas', 'hourglass-end']" />
      </button>
    </template>
  </BInputGroup>
</template>

<script setup lang="ts">
const to = defineModel<string | null>('to', { required: true })
const isTracking = defineModel<boolean | undefined>('isTracking', { required: true })
defineProps<{ precision: number }>()
</script>
