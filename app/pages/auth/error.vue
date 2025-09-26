<template>
  <div class="container d-flex justify-content-center align-items-center mt-5">
    <p>Authentication error: {{ errorCode }}</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  auth: { unauthenticatedOnly: true, navigateAuthenticatedTo: '/' },
})

const route = useRoute()
const errorCode = computed(() => {
  switch (route.query.error) {
    case 'Configuration':
    case 'AccessDenied':
      return 'Internal authentication error'
    case 'Verification':
      return 'OAuth callback error'
    case 'Default':
      return 'Unknown error'
    default:
      return `Unknown error: ${route.query.error}`
  }
})
</script>
