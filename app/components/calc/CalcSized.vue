<template>
  <div v-if="viewport.isGreaterOrEquals('lg')" class="d-none d-lg-block">
    <CalcTable :calc-info="calcInfo" />
  </div>
  <div v-if="viewport.isLessThan('lg')" class="d-lg-none">
    <CalcCards :calc-info="calcInfo" />
  </div>
</template>

<script setup lang="ts">
defineProps<{ calcInfo: CalcInfo }>()
const viewport = useViewport()
</script>
