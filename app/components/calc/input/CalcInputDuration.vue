<template>
  <CalcInputParsed v-model="duration" :parse="strToMinutesSafe" :format="strFromMinutes" :required="required" />
</template>

<script setup lang="ts">
import CalcInputParsed from '~/components/calc/input/CalcInputParsed.vue'

defineProps<{ required?: boolean }>()
const duration = defineModel<number | null | undefined>({ required: true })
</script>
