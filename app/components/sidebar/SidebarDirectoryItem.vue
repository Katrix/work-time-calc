<template>
  <span class="directory-item">
    <FontAwesomeIcon :icon="['fas', icon]" size="lg" />
    <slot />
  </span>
</template>

<script setup lang="ts">
defineProps<{ icon: string }>()
</script>
