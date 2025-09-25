<template>
  <div
    style="
      display: grid;
      column-gap: 1rem;
      grid-template-columns: [from-desc-start] auto [from-desc-end from-val-start] 10fr [from-val-end] 1fr [to-desc-start] auto [to-desc-end to-val-start] 10fr [to-val-end buttons-start] auto [buttons-end];
    "
  >
    <label style="grid-column: from-desc-start / from-desc-end">From:</label>
    <div style="grid-column: from-val-start / from-val-end">
      <BFormInput type="date" :min="dateMin" :max="dateMax" v-model="fromStr" />
    </div>
    <label style="grid-column: to-desc-start / to-desc-end">To:</label>
    <div style="grid-column: to-val-start / to-val-end">
      <BFormInput type="date" :min="dateMin" :max="dateMax" v-model="toStr" />
    </div>
    <div style="grid-column: buttons-start / buttons-end">
      <button type="button" class="btn btn-secondary btn-sm" @click="$emit('addAfter')">
        <FontAwesomeIcon :icon="['fas', 'plus']" />
      </button>
      <button type="button" class="btn btn-secondary btn-sm" @click="$emit('remove')">
        <FontAwesomeIcon :icon="['fas', 'minus']" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Temporal } from '@js-temporal/polyfill'

const thisYear = new Date().getFullYear()
const dateMin = `${thisYear}-01-01`
const dateMax = `${thisYear}-12-31`

const from = defineModel<Temporal.PlainMonthDay>('from', { required: true })
const to = defineModel<Temporal.PlainMonthDay>('to', { required: true })

defineEmits<{
  (e: 'addAfter'): void
  (e: 'remove'): void
}>()

function makeDateStrRef(date: Ref<Temporal.PlainMonthDay>) {
  return computed<string, string>({
    get() {
      return `${thisYear}-${date.value.toString()}`
    },
    set(val) {
      date.value = Temporal.PlainDate.from(val).toPlainMonthDay()
    },
  })
}

const fromStr = makeDateStrRef(from)
const toStr = makeDateStrRef(to)
</script>
