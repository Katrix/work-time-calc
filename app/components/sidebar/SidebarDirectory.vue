<template>
  <ul class="directory">
    <slot />
    <li v-for="item in items">
      <SidebarDirectoryItem v-if="'text' in item" :icon="item.icon">
        {{ item.text }}
      </SidebarDirectoryItem>
      <SidebarDirectory v-else :items="item" />
    </li>
  </ul>
</template>

<script setup lang="ts">
interface Item {
  icon: string
  text: string
}

defineProps<{
  items?: (Item | Item[])[]
}>()
</script>
