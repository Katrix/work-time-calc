<template>
  <WorkCalc ref="calcObs" class="mt-2" :store-id="route.params.calculation"></WorkCalc>
</template>

<script setup lang="ts">
const route = useRoute('calculation')
const calcStore = useCalcStore()

watch(
  route,
  () => {
    if (!calcStore.calcs.includes(route.params.calculation)) {
      calcStore.calcs.push(route.params.calculation)
    }
  },
  {
    immediate: true,
  },
)

// Things get a bit slow otherwise. Maybe smart to find out why
definePageMeta({
  keepalive: true
})
</script>
