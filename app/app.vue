<template>
  <BApp>
    <BContainer fluid="xl" class="wider-container h-100">
      <h1 class="d-flex justify-content-between">
        Work time calc

        <span>
          <AuthState v-slot="{ loggedIn, clear }">
            <BButton v-if="loggedIn" @click="clear()">Sign out</BButton>
            <BButton v-else variant="primary" href="/auth/github">Sign in with GitHub</BButton>
          </AuthState>
        </span>
      </h1>

      <ul class="nav nav-tabs" role="tablist">
        <li class="nav-item" role="presentation" v-for="(id, idx) in calcStore.calcOrder" :key="id">
          <NuxtLink class="nav-link" :to="{ name: 'calculation', params: { calculation: id } }" active-class="active">
            {{ calcStore.calcName(id, idx) }}
            <BButton
              v-if="calcStore.calcs.size > 1"
              variant="danger"
              size="sm"
              @click.prevent="calcStore.removeCalc(id)"
            >
              <FontAwesomeIcon :icon="['fas', 'times']"></FontAwesomeIcon>
            </BButton>
          </NuxtLink>
        </li>

        <li class="nav-item" role="presentation">
          <NuxtLink class="nav-link" :to="{ name: 'settings' }">Settings</NuxtLink>
        </li>

        <li class="nav-item" role="presentation">
          <button class="nav-link" @click.prevent="calcStore.addCalc()"><b>+</b></button>
        </li>
      </ul>

      <NuxtPage />
      <NuxtRouteAnnouncer />
    </BContainer>
  </BApp>
</template>

<script setup lang="ts">
const calcStore = useCalcStore()
const intervalId = ref<number>()
const now = useNow()
onMounted(() => {
  intervalId.value = setInterval(() => {
    now.value = new Date()
  }, 1000) as unknown as number
})
onUnmounted(() => clearInterval(intervalId.value))
</script>
