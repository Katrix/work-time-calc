<template>
  <BApp>
    <BContainer fluid="xl" class="wider-container">
      <h1>Work time calc</h1>

      <ul class="nav nav-tabs" role="tablist">
        <li class="nav-item" role="presentation" v-for="(id, idx) in calcStore.calcs" :key="id">
          <NuxtLink class="nav-link" :to="{ name: 'calculation', params: { calculation: id } }" active-class="active">
            {{ calcStore.calcName(idx) }}
            <BButton
              v-if="calcStore.calcs.length > 1"
              variant="danger"
              size="sm"
              @click.prevent="calcStore.removeCalc(idx)"
            >
              <FontAwesomeIcon :icon="['fas', 'times']"></FontAwesomeIcon>
            </BButton>
          </NuxtLink>
        </li>

        <li class="nav-item" role="presentation">
          <NuxtLink class="nav-link" :to="{ name: 'settings' }">Settings</NuxtLink>
        </li>

        <li class="nav-item" role="presentation">
          <button class="nav-link" @click.prevent="calcStore.addCalc()"><b>+</b></button>
        </li>
      </ul>

      <NuxtPage />
      <NuxtRouteAnnouncer />
    </BContainer>
  </BApp>
</template>

<script setup lang="ts">
const calcStore = useCalcStore()
</script>
