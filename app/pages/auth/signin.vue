<template>
  <div class="container d-flex flex-column justify-content-center align-items-center mt-5">
    <div v-if="errorCode !== null" class="alert alert-danger w-50 text-center">
      {{ errorCode }}
    </div>
    <BButton variant="primary" @click="signIn('github')">Sign in with GitHub</BButton>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  auth: { unauthenticatedOnly: true, navigateAuthenticatedTo: '/' },
})

const { signIn } = useAuth()

const route = useRoute()
const errorCode = computed(() => {
  if (!route.query.error) {
    return null
  }
  switch (route.query.error) {
    case 'OAuthSignin':
      return 'OAuth signin error'
    case 'OAuthCallback':
      return 'OAuth callback error'
    case 'Callback':
      return 'Callback error'
    case 'Default':
      return 'Unknown error'
    default:
      return `Unknown error: ${route.query.error}`
  }
})
</script>
