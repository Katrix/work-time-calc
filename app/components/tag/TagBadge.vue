<template>
  <span class="badge contrast-color" :style="{ '--contrast-color': calc.getTagColor(tag) }"
    >{{ tag
    }}<FontAwesomeIcon
      v-if="!hideDelete"
      style="cursor: pointer; margin-left: 0.2rem"
      :icon="['fas', 'times-circle']"
      @click="emits('deleteTag')"
  /></span>
</template>

<script setup lang="ts">
const props = defineProps<{
  tag: string
  calcId: string
  hideDelete?: boolean
}>()
const calcStore = useCalcStore()
const calc = calcStore.useCalc(computed(() => props.calcId))

const emits = defineEmits<{ (e: 'deleteTag'): void }>()
</script>

<style>
/* https://lea.verou.me/blog/2024/contrast-color/ */

@property --contrast-color {
  syntax: '<color>';
  inherits: true;
  initial-value: transparent;
}

:root {
  --l-threshold: 0.7;
}

.contrast-color {
  /* Fallback for browsers that don't support RCS */
  color: white !important;
  text-shadow:
    0 0 0.05em black,
    0 0 0.05em black,
    0 0 0.05em black,
    0 0 0.05em black;
  background-color: var(--contrast-color);

  @supports (color: oklch(from red l c h)) {
    --l: clamp(0, (l / var(--l-threshold, 0.623) - 1) * -infinity, 1);
    color: oklch(from var(--contrast-color) var(--l) 0 h) !important;
    text-shadow: none;
  }

  @supports (color: contrast-color(red)) {
    color: contrast-color(var(--contrast-color)) !important;
    text-shadow: none;
  }
}
</style>
