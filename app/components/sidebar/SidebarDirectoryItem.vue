<template>
  <span class="directory-item">
    <FontAwesomeIcon :icon="['fas', icon]" size="lg" />
    <span class="expanded-only">
      <slot />
    </span>
  </span>
</template>

<script setup lang="ts">
defineProps<{ icon: string }>()
</script>
