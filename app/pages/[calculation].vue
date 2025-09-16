<template>
  <WorkCalc ref="calcObs" class="mt-2" :store-id="route.params.calculation"></WorkCalc>
</template>

<script setup lang="ts">
const route = useRoute('calculation')

const calculations = useLocalStorage<string[]>('calculations', [route.params.calculation], {
  listenToStorageChanges: true,
})
watchEffect(() => {

  if (!calculations.value.includes(route.params.calculation)) {
    calculations.value.push(route.params.calculation)
  }
})
</script>
