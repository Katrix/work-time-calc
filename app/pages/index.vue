<template>
  <div class="d-flex justify-content-center align-items-center mt-5" v-show="!foundCalc">
    <div v-if="calcStore.loading">
      <FontAwesomeIcon :icon="['fa', 'spinner']" spin size="8x"></FontAwesomeIcon>
    </div>
    <div v-else-if="calcStore.calcOrder.length > 0" class="card w-25">
      <div class="card-header">Calculations</div>

      <ul class="list-group list-group-flush">
        <li class="list-group-item" v-for="calcId in calcStore.calcOrder" :key="calcId">
          <NuxtLink :to="{ name: 'calculation', params: { calculation: calcId } }">
            {{ calcStore.allCalcs.get(calcId)?.name }}
          </NuxtLink>
        </li>
      </ul>
    </div>
    <div v-else class="btn-group">
      <button class="btn btn-primary" @click="addCalc()">
        New calculation
        <FontAwesomeIcon v-if="loadingNew" :icon="['fas', 'spinner']" spin></FontAwesomeIcon>
      </button>
      <button class="btn btn-primary" @click="loadFromFile()">
        Load existing
        <FontAwesomeIcon v-if="loadingFile" :icon="['fas', 'spinner']" spin></FontAwesomeIcon>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const calcStore = useCalcStore()
const foundCalc = ref(false)

const loadingNew = ref(false)
const loadingFile = ref(false)

async function addCalc() {
  loadingNew.value = true
  await calcStore.addCalc()
  loadingNew.value = false
}

const { open: loadFromFile, onChange } = useFileDialog({ accept: '.json', reset: true })
onChange(async (fileList) => {
  if (fileList && fileList.length > 0) {
    try {
      loadingFile.value = true
      const file = fileList[0]
      const id = await calcStore.addCalc()
      const info = await useCalcsInfo(computed(() => id))
      await info.loadFromFile(file)
    } finally {
      loadingFile.value = false
    }
  }
})
</script>
