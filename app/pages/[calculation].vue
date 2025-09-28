<template>
  <div v-if="calcStore.allCalcs.has(calcId)" class="mt-2">
    <CalcSettings :key="calcId" :calc-info="calcInfo"></CalcSettings>
    <hr />
    <CalcSized :key="calcId" :calc-info="calcInfo" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute('calculation')
const calcId = computed(() => route.params.calculation)

const calcStore = useCalcStore()

watch(
  route,
  () => {
    if (!calcStore.allCalcs.has(calcId.value)) {
      if (calcStore.allCalcs.size === 0) {
        return navigateTo('/')
      } else {
        return navigateTo(`/${calcStore.firstCalc()}`)
      }
    }

    if (!calcStore.calcOrder.includes(calcId.value)) {
      calcStore.calcOrder.push(calcId.value)
    }
  },
  {
    immediate: true,
  },
)

// To not refetch calcs when we switch pages
definePageMeta({
  keepalive: true,
})

const calcInfo = await useCalcsInfo(calcId)
</script>
