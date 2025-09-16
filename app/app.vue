<template>
  <BApp>
    <BContainer fluid="xl" class="wider-container">
      <h1>Work time calc</h1>

      <BTabs v-model:index="active">
        <BTab v-for="(id, idx) in calcs" :key="id">
          <template #title>
            {{ calcName(idx) }}
            <BButton v-if="calcsLength > 1" variant="danger" size="sm" @click.prevent="removeCalc(idx)">
              <FontAwesomeIcon :icon="['fas', 'times']"></FontAwesomeIcon>
            </BButton>
          </template>

          <WorkCalc ref="calcObs" class="mt-2" :store-id="id"></WorkCalc>
        </BTab>

        <BTab title="Defaults">
          <div class="row">
            <div class="col-6">
              <h2>Hours</h2>
              <DefaultSettings mode="hours" />
            </div>
            <div class="col-6">
              <h2>Tasks</h2>
              <DefaultSettings mode="tasks" />
            </div>
          </div>
        </BTab>

        <template #tabs-end>
          <BNavItem role="presentation" href="#" @click.prevent="addCalc()">
            <b>+</b>
          </BNavItem>
        </template>
      </BTabs>
    </BContainer>
  </BApp>
</template>

<script setup lang="ts">
import type { WorkCalc } from '#components'

const calcs = useLocalStorage<string[]>('calculations', [crypto.randomUUID()])
const calcObs = ref<InstanceType<typeof WorkCalc>[] | null>(null)
const active = ref(0)

const calcsLength = computed(() => Object.entries(calcs.value).length)

function addCalc() {
  clearOldLocalStorageItems()
  calcs.value.push(crypto.randomUUID())
  setTimeout(() => {
    active.value = calcs.value.length - 1
  }, 50)
}

function removeCalc(idx: number) {
  if (active.value === idx && idx > 0) {
    active.value--
  }
  calcs.value.splice(idx, 1)
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
  const objs = calcObs.value ?? []
  const name = objs[idx]?.name
  return name && name.length ? name : `Calc${idx + 1}`
}
</script>
