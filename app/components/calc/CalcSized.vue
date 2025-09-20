<template>
  <div class="d-none d-lg-block" style="overflow-x: scroll">
    <CalcTable :calc-id="calcId" />
  </div>
  <div class="d-lg-none">
    <CalcCards :calc-id="calcId" />
  </div>
</template>

<script setup lang="ts">
defineProps<{ calcId: string }>()
</script>
