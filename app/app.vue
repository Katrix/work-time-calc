<template>
  <BApp>
    <div class="d-flex h-100">
      <Sidebar>
        <SidebarHeading is="h2" icon="folder-tree" text="Previous calcs" />
        <hr />
        <SidebarHeading is="h3" icon="calendar" text="Hours" />
        <SidebarDirectory>
          <li v-for="hour in hours">
            <SidebarDirectoryItem icon="folder">Nested</SidebarDirectoryItem>
            <SidebarDirectory>
              <li>
                <SidebarDirectoryItem icon="folder">Further nested</SidebarDirectoryItem>
                <SidebarDirectory>
                  <li>
                    <SidebarDirectoryItem icon="file">{{ hour }} A</SidebarDirectoryItem>
                  </li>
                  <li>
                    <SidebarDirectoryItem icon="file">{{ hour }} B</SidebarDirectoryItem>
                  </li>
                </SidebarDirectory>
              </li>
            </SidebarDirectory>
          </li>
        </SidebarDirectory>
        <hr />
        <SidebarHeading is="h3" icon="clock" text="Tasks" />
        <SidebarDirectory>
          <li v-for="task in tasks">
            <SidebarDirectoryItem icon="file">
              {{ task }}
            </SidebarDirectoryItem>
          </li>
        </SidebarDirectory>
      </Sidebar>

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
              <BButton variant="danger" size="sm" @click.prevent="calcStore.removeCalc(id)">
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
import SidebarHeading from '~/components/sidebar/SidebarHeading.vue'
import SidebarDirectory from '~/components/sidebar/SidebarDirectory.vue'
import SidebarDirectoryItem from '~/components/sidebar/SidebarDirectoryItem.vue'

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
