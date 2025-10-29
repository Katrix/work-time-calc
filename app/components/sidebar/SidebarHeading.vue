<template>
  <component :is="is">
    <FontAwesomeIcon :icon="['fas', icon]" size="lg" />
    <span class="expanded-only">{{ text }}</span>
  </component>
</template>

<script setup lang="ts">
defineProps<{ is: string; icon: string; text: string }>()
</script>
