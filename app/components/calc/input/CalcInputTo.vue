<template>
  <BInputGroup>
    <CalcInputDuration
      :model-value="isTracking ? dateToMinutesRounded(now, precision) : to"
      :disabled="isTracking"
      :required="false"
      @update:model-value="(v) => (to = v)"
    />
    <template #append>
      <button class="btn btn-secondary" @click="to = currentTime(precision)">
        <FontAwesomeIcon :icon="['fas', 'clock']" />
      </button>
      <button
        v-if="!isTracking && (to ?? '') === ''"
        class="btn btn-secondary"
        @click="
          () => {
            to = currentTime(precision)
            isTracking = true
          }
        "
      >
        <FontAwesomeIcon :icon="['fas', 'hourglass-start']" />
      </button>
      <button
        v-else-if="isTracking"
        class="btn btn-primary"
        @click="
          () => {
            to = currentTime(precision)
            isTracking = false
          }
        "
      >
        <FontAwesomeIcon :icon="['fas', 'hourglass-half']" />
      </button>
      <button v-else class="btn btn-secondary" disabled>
        <FontAwesomeIcon :icon="['fas', 'hourglass-end']" />
      </button>
    </template>
  </BInputGroup>
</template>

<script setup lang="ts">
const to = defineModel<number | undefined | null>('to', { required: true })
const isTracking = defineModel<boolean | undefined>('isTracking', { required: true })
defineProps<{ precision: number }>()
const now = useTickedNow()
</script>
