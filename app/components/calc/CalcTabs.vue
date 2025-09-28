<template>
  <ul class="nav nav-tabs" role="tablist">
    <li class="nav-item" role="presentation" v-for="id in calcStore.calcOrder" :key="id">
      <NuxtLink class="nav-link" :to="{ name: 'calculation', params: { calculation: id } }" active-class="active">
        {{ calcStore.allCalcs.get(id)?.name }}
        <BButton variant="danger" size="sm" @click.prevent="calcStore.closeCalc(id)">
          <FontAwesomeIcon :icon="['fas', 'times']"></FontAwesomeIcon>
        </BButton>
      </NuxtLink>
    </li>

    <li class="nav-item" role="presentation">
      <NuxtLink class="nav-link" :to="{ name: 'settings' }">
        Settings
        <FontAwesomeIcon
          v-if="presetStore.runUpdate.isPending"
          :icon="['fa', 'spinner']"
          spin
          size="lg"
        ></FontAwesomeIcon
      ></NuxtLink>
    </li>

    <li class="nav-item" role="presentation">
      <button class="nav-link" @click.prevent="addCalc()">
        <b v-if="!adding">+</b>
        <FontAwesomeIcon v-else :icon="['fas', 'spinner']" spin></FontAwesomeIcon>
      </button>
    </li>
  </ul>
</template>

<script setup lang="ts">
const calcStore = useCalcStore()
const presetStore = usePresetStore()

const adding = ref(false)

async function addCalc() {
  adding.value = true
  await calcStore.addCalc()
  adding.value = false
}
</script>
