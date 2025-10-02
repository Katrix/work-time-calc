<template>
  <BInputGroup>
    <CalcInputDuration
      :model-value="isTracking ? dateToMinutesRounded(now, precision) : to"
      @update:model-value="(v) => (to = v)"
      :disabled="isTracking"
      :required="false"
    />
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
      <button
        class="btn btn-primary"
        v-else-if="isTracking"
        @click="
          () => {
            to = currentTime(precision)
            isTracking = false
          }
        "
      >
        <FontAwesomeIcon :icon="['fas', 'hourglass-half']" />
      </button>
      <button class="btn btn-secondary" v-else disabled>
        <FontAwesomeIcon :icon="['fas', 'hourglass-end']" />
      </button>
    </template>
  </BInputGroup>
</template>

<script setup lang="ts">
const to = defineModel<number | undefined | null>('to', { required: true })
const isTracking = defineModel<boolean | undefined>('isTracking', { required: true })
defineProps<{ precision: number }>()
const now = useNow()
</script>
