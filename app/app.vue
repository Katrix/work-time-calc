<template>
  <BApp>
    <BContainer fluid="xl" class="wider-container">
      <h1>Work time calc</h1>

      <ul class="nav nav-tabs" role="tablist">
        <li class="nav-item" role="presentation" v-for="(id, idx) in calcs" :key="id">
          <NuxtLink class="nav-link" :to="{ name: 'calculation', params: { calculation: id } }" active-class="active">
            {{ calcName(idx) }}
            <BButton v-if="calcsLength > 1" variant="danger" size="sm" @click.prevent="removeCalc(idx)">
              <FontAwesomeIcon :icon="['fas', 'times']"></FontAwesomeIcon>
            </BButton>
          </NuxtLink>
        </li>

        <li class="nav-item" role="presentation">
          <NuxtLink class="nav-link" :to="{ name: 'settings' }">Settings</NuxtLink>
        </li>

        <li class="nav-item" role="presentation">
          <button class="nav-link" @click.prevent="addCalc()"><b>+</b></button>
        </li>
      </ul>

      <NuxtPage />
      <NuxtRouteAnnouncer />
    </BContainer>
  </BApp>
</template>

<script setup lang="ts">
const calcs = useLocalStorage<string[]>('calculations', [crypto.randomUUID()], {
  listenToStorageChanges: true,
})
const calcsLength = computed(() => Object.entries(calcs.value).length)

function addCalc() {
  clearOldLocalStorageItems()
  const newId = crypto.randomUUID()
  calcs.value.push(newId)
  navigateTo({ name: 'calculation', params: { calculation: newId } })
}

const route = useRoute()

function removeCalc(idx: number) {
  const needNavigation = route.name === 'calculation' && route.params.calculation === calcs.value[idx]
  calcs.value.splice(idx, 1)
  if (needNavigation) {
    navigateTo({
      name: 'calculation',
      params: { calculation: calcs.value[Math.min(idx + 1, calcs.value.length - 1)] },
    })
  }
  clearOldLocalStorageItems()
}

function clearOldLocalStorageItems() {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key !== 'calculations' && calcs.value.every((s) => !key.includes(s)) && !key.includes('default')) {
      localStorage.removeItem(key)
    }
  }
}

function calcName(idx: number) {
  const storeId = calcs.value[idx]
  const store = useSettingsStore(storeId)
  return store.nameInput.length ? store.nameInput : `Calc${idx + 1}`
}
</script>
