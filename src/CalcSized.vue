<template>
  <div class="d-none d-lg-block" style="overflow-x: scroll">
    <CalcTable
      :custom-subtracted-time="customSubtractedTime"
      :tracking="tracking"
      :computed-work-days="computedWorkDays"
      :mode="mode"
      :precision="precision"
      @update:work-days-day="(idx, value) => $emit('update:workDays-day', idx, value)"
      @update:work-days-from="(idx, value) => $emit('update:workDays-from', idx, value)"
      @update:work-days-to="(idx, value) => $emit('update:workDays-to', idx, value)"
      @update:work-days-subtracted-time="(idx, value) => $emit('update:workDays-subtractedTime', idx, value)"
      @update:work-days-notes="(idx, value) => $emit('update:workDays-notes', idx, value)"
      @update:work-days-tracking="(idx, value) => $emit('update:workDays-tracking', idx, value)"
      @add-row-after="(idx) => $emit('addRowAfter', idx)"
      @remove-row="(idx) => $emit('removeRow', idx)"
      @toggle-custom-subtracted-time="(idx) => $emit('toggleCustomSubtractedTime', idx)"
    ></CalcTable>
  </div>
  <div class="d-lg-none">
    <CalcCards
      :custom-subtracted-time="customSubtractedTime"
      :tracking="tracking"
      :computed-work-days="computedWorkDays"
      :mode="mode"
      :precision="precision"
      @update:work-days-day="(idx, value) => $emit('update:workDays-day', idx, value)"
      @update:work-days-from="(idx, value) => $emit('update:workDays-from', idx, value)"
      @update:work-days-to="(idx, value) => $emit('update:workDays-to', idx, value)"
      @update:work-days-subtracted-time="(idx, value) => $emit('update:workDays-subtractedTime', idx, value)"
      @update:work-days-notes="(idx, value) => $emit('update:workDays-notes', idx, value)"
      @update:work-days-tracking="(idx, value) => $emit('update:workDays-tracking', idx, value)"
      @add-row-after="(idx) => $emit('addRowAfter', idx)"
      @remove-row="(idx) => $emit('removeRow', idx)"
      @toggle-custom-subtracted-time="(idx) => $emit('toggleCustomSubtractedTime', idx)"
    ></CalcCards>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import CalcTable from '@/CalcTable.vue'
import CalcCards from '@/CalcCards.vue'
import type { ComputedWorkEntries } from '@/ComputeWorkTime'

defineProps({
  mode: {
    type: String,
    required: true,
  },
  computedWorkDays: {
    type: Array as PropType<ComputedWorkEntries[]>,
    required: true,
  },
  customSubtractedTime: {
    type: Array as PropType<boolean[]>,
    required: true,
  },
  tracking: {
    type: Array as PropType<boolean[]>,
    required: true,
  },
  precision: {
    type: Number,
    required: true
  }
})

defineEmits<{
  (e: 'update:workDays-day', idx: number, day: string): void
  (e: 'update:workDays-from', idx: number, from: string | null): void
  (e: 'update:workDays-to', idx: number, to: string | null): void
  (e: 'update:workDays-subtractedTime', idx: number, subtractedTime: string | null): void
  (e: 'update:workDays-notes', idx: number, notes: string | null): void
  (e: 'update:workDays-tracking', idx: number, tracking: boolean): void
  (e: 'addRowAfter', idx: number): void
  (e: 'removeRow', idx: number): void
  (e: 'toggleCustomSubtractedTime', idx: number): void
}>()
</script>
