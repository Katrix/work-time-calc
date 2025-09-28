<template>
  <BOrchestrator />
  <div class="d-flex h-100">
    <SidebarCalcs />

    <BContainer fluid="xl" class="flex-fill container wider-container">
      <h1 class="d-flex justify-content-between">
        Work time calc

        <span>
          <AuthState v-slot="{ loggedIn, clear }">
            <BButton v-if="loggedIn" @click="clear()">Sign out</BButton>
            <BButton v-else variant="primary" href="/auth/github">Sign in with GitHub</BButton>
          </AuthState>
        </span>
      </h1>

      <CalcTabs />

      <NuxtPage />
      <NuxtRouteAnnouncer />
    </BContainer>
  </div>
</template>

<script setup lang="ts">
import { debounceFilter } from '@vueuse/shared'

const presetStore = usePresetStore()
const calcStore = useCalcStore()
const session = useUserSession()

if (session.loggedIn.value) {
  await callOnce(async () => await presetStore.fetchData())
  await callOnce(async () => await calcStore.fetchData())
}

const trackedIntervalId = ref<number>()
const now = useNow()
const toast = useToast()
onMounted(async () => {
  trackedIntervalId.value = setInterval(() => {
    now.value = new Date()
  }, 1000) as unknown as number

  presetStore.fetchLocalData(toast)
  calcStore.fetchLocalData(toast)
})
onUnmounted(() => clearInterval(trackedIntervalId.value))

watchWithFilter(
  computed(() => presetStore.updates),
  () => {
    if (session.loggedIn.value) {
      presetStore.runUpdate.mutate()
    }
  },
  { deep: true, eventFilter: debounceFilter(1_500) },
)
</script>
