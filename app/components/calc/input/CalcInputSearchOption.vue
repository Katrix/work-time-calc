<template>
  <li
    :id="id"
    class="list-group-item"
    style="cursor: pointer"
    role="option"
    :aria-selected="selected"
    :style="{ borderTopLeftRadius: isFirst ? 0 : undefined, borderTopRightRadius: isFirst ? 0 : undefined }"
    :class="{ active: selected }"
    @click="$emit('selected')"
  >
    {{ text }}
  </li>
</template>
<script setup lang="ts">
const id = useId()

defineProps<{
  selected: boolean
  isFirst: boolean
  text: string
}>()

defineEmits<{
  (e: 'selected'): void
}>()

defineExpose({
  id,
})
</script>
