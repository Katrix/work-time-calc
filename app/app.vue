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
import { debounceFilter } from '@vueuse/core'

const presetStore = usePresetStore()
const calcStore = useCalcStore()
const session = useUserSession()

if (session.loggedIn.value) {
  await callOnce('fetchPresetData', async () => await presetStore.fetchData())
  await callOnce('fetchCalcData', async () => await calcStore.fetchData())
}

const now = useTickedNow()
const toast = useToast()

useIntervalFn(
  () => {
    now.value = new Date()
  },
  1000,
  { immediate: true },
)

onMounted(async () => {
  presetStore.fetchLocalData(toast)
  await calcStore.fetchLocalData()
})

const updateEventFilter = debounceFilter(1_500)
useFlushOnHidden(updateEventFilter)
watchWithFilter(
  computed(() => presetStore.updates),
  () => {
    if (session.loggedIn.value) {
      presetStore.runUpdate.mutate()
    }
  },
  { deep: true, eventFilter: updateEventFilter },
)
</script>
