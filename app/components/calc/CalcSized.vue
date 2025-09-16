<template>
  <div class="d-none d-lg-block" style="overflow-x: scroll">
    <CalcTable :store-id="storeId" />
  </div>
  <div class="d-lg-none">
    <CalcCards :store-id="storeId" />
  </div>
</template>

<script setup lang="ts">
defineProps<{ storeId: string }>()
</script>
