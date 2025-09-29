<template>
  <BFormInput v-model="durationStr" :state="valid ? null : false" />
</template>

<script generic="T" setup lang="ts">
const props = defineProps<{
  modelValue: T | null | undefined
  parse: (str: string) => T | null | undefined
  format: (t: T) => string
  required?: boolean
}>()
const durationStr = ref('')
const valid = ref(true)

const emits = defineEmits<{ (e: 'update:modelValue', v: T | null | undefined): void }>()

watch(
  computed(() => props.modelValue),
  (newVal) => {
    if (newVal === null) {
      durationStr.value = ''
    } else if (newVal !== undefined) {
      if (props.parse(durationStr.value) !== newVal) {
        durationStr.value = props.format(newVal)
      }
    }
  },
  {
    immediate: true,
  },
)

watch(
  durationStr,
  (newVal) => {
    const newMin = props.parse(newVal)

    valid.value = newMin !== undefined && (!props.required || newMin !== null)
    if (props.modelValue !== newMin) {
      emits('update:modelValue', newMin)
    }
  },
  { immediate: true },
)
</script>
