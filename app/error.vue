<template>
  <BContainer class="py-5">
    <h1>{{ error.status }} {{ error.statusText }}</h1>
    <NuxtLink to="/">Go to frontpage</NuxtLink>
  </BContainer>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'
defineProps<{ error: NuxtError }>()
</script>
