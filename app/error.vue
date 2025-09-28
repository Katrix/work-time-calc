<template>
  <BContainer class="py-5">
    <h1>{{ error.statusCode }} {{ error.statusMessage }}</h1>
    <NuxtLink to="/">Go to frontpage</NuxtLink>
    {{ session.session.value?.user }}
    {{ session.loggedIn }}
    {{ session.ready }}
  </BContainer>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'
defineProps<{ error: NuxtError }>()

const session = useUserSession()
</script>
