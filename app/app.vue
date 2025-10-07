<template>
  <BApp>
    <div class="d-flex h-100">
      <aside class="sidebar p-2">
        <div class="sidebar-expanded-only">
          <h2>Previous calcs</h2>
          <hr />
          <h3>Hours</h3>
          <ul class="directory">
            <li v-for="hour in hours">
              <span class="directory-item">Nested</span>
              <ul>
                <li>
                  <span class="directory-item">Further nested</span>
                  <ul>
                    <li>
                      <span class="directory-item">{{ hour }} A</span>
                    </li>
                    <li>
                      <span class="directory-item">{{ hour }} B</span>
                    </li>
                  </ul>
                </li>
              </ul>
            </li>
          </ul>
          <h3>Tasks</h3>
          <ul class="directory">
            <li v-for="task in tasks">
              <span class="directory-item">{{ task }}</span>
            </li>
          </ul>
        </div>
        <div class="sidebar-contracted-only">
          <FontAwesomeIcon :icon="['fas', 'folder-tree']" size="2x" />
        </div>
      </aside>

      <BContainer fluid="xl" class="flex-fill container wider-container">
        <h1 class="d-flex justify-content-between">
          Work time calc

          <span>
            <AuthState v-slot="{ loggedIn, clear }">
              <BButton v-if="loggedIn" @click="clear()">Sign out</BButton>
              <BButton v-else variant="primary" href="/auth/github">Sign in with GitHub</BButton>
            </AuthState>
          </span>
        </h1>

        <ul class="nav nav-tabs" role="tablist">
          <li class="nav-item" role="presentation" v-for="(id, idx) in calcStore.calcOrder" :key="id">
            <NuxtLink class="nav-link" :to="{ name: 'calculation', params: { calculation: id } }" active-class="active">
              {{ calcStore.calcName(id, idx) }}
              <BButton
                v-if="calcStore.calcs.size > 1"
                variant="danger"
                size="sm"
                @click.prevent="calcStore.removeCalc(id)"
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
    </div>
  </BApp>
</template>

<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCalendar, faClock, faCog, faHome, faPersonCirclePlus } from '@fortawesome/free-solid-svg-icons'

const calcStore = useCalcStore()
const intervalId = ref<number>()
const now = useNow()
onMounted(() => {
  intervalId.value = setInterval(() => {
    now.value = new Date()
  }, 1000) as unknown as number
})
onUnmounted(() => clearInterval(intervalId.value))

const hours = Array.from({ length: 50 }, (_, i) => 'Hours ' + (i + 1))
const tasks = Array.from({ length: 50 }, (_, i) => 'Task ' + (i + 1))
</script>
