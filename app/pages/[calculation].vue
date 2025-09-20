<template>
  <WorkCalc
    v-if="calcStore.calcs.has(route.params.calculation)"
    class="mt-2"
    :calc-id="route.params.calculation"
  ></WorkCalc>
</template>

<script setup lang="ts">
const route = useRoute('calculation')
const calcStore = useCalcStore()

watch(
  route,
  () => {
    if (!calcStore.calcs.has(route.params.calculation)) {
      return navigateTo(`/${calcStore.firstCalc()}`)
    }
  },
  {
    immediate: true,
  },
)

// Things get a bit slow otherwise. Maybe smart to find out why
definePageMeta({
  keepalive: true,
})
</script>
