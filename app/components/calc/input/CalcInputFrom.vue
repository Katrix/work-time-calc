<template>
  <BInputGroup>
    <CalcInputDuration v-model="from" required />
    <template #append>
      <button class="btn btn-secondary" @click="from = currentTime(precision)">
        <FontAwesomeIcon :icon="['fas', 'clock']" />
      </button>
    </template>
  </BInputGroup>
</template>

<script setup lang="ts">
const from = defineModel<number | null | undefined>({ required: true })
defineProps<{ precision: number }>()
</script>
