<template>
  <NuxtLink v-if="to" class="directory-item" :to="to">
    <FontAwesomeIcon :icon="['fas', icon]" size="lg" />
    <slot />
  </NuxtLink>
  <span v-else class="directory-item">
    <FontAwesomeIcon :icon="['fas', icon]" size="lg" />
    <slot />
  </span>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from '#vue-router'

defineProps<{ icon: string; to?: RouteLocationRaw }>()
</script>
