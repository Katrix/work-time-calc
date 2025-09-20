<template>
  <div class="d-flex justify-content-center align-items-center mt-5" v-show="!foundCalc">
    <div v-if="loading">
      <FontAwesomeIcon :icon="['fa', 'spinner']" spin size="8x"></FontAwesomeIcon>
    </div>
    <div v-else-if="calcStore.calcs.size > 0" class="card w-25">
      <div class="card-header">Calculations</div>

      <ul class="list-group list-group-flush">
        <li class="list-group-item" v-for="[calcId, calc] in calcStore.calcs.entries()" :key="calcId">
          <NuxtLink :to="{ name: 'calculation', params: { calculation: calcId } }">
            {{ calc.entry.value.name }}
          </NuxtLink>
        </li>
      </ul>
    </div>
    <div v-else class="btn-group">
      <button class="btn btn-primary" @click="calcStore.addCalc()">New calculation</button>
      <button class="btn btn-primary" @click="loadFromFile">Load existing</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const calcStore = useCalcStore()
const loading = ref(true)
const foundCalc = ref(false)

calcStore.waitForLocalStorage.then(() => {
  loading.value = false
})

function loadFromFile() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      const id = crypto.randomUUID()
      calcStore.addCalc(id)
      const calc = calcStore.useCalc(computed(() => id))
      await calc.loadFromFile(file)
    }
  }
  input.click()
}
</script>
