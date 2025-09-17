<template>
  <BInputGroup>
    <BFormInput v-model="from" />
    <template #append>
      <button class="btn btn-secondary" @click="from = currentTime(precision)">
        <FontAwesomeIcon :icon="['fas', 'clock']" />
      </button>
    </template>
  </BInputGroup>
</template>

<script setup lang="ts">
const from = defineModel<string | null>({ required: true })
defineProps<{ storeId: string; precision: number }>()
</script>
