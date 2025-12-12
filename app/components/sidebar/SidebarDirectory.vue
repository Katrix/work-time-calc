<template>
  <ul class="directory">
    <slot />
    <li v-for="item in items">
      <SidebarDirectoryItem v-if="'text' in item" :icon="item.icon">
        <NuxtLink class="expanded-only" v-if="item.to" :to="item.to">{{ item.text }}</NuxtLink>
        <span class="expanded-only" v-else>{{ item.text }}</span>
      </SidebarDirectoryItem>
      <SidebarDirectory v-else :items="item" />
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

interface TextItem {
  icon: string
  text: string
  to?: RouteLocationRaw
}
type Item = TextItem | Item[]

defineProps<{
  items?: Item[]
}>()
</script>
