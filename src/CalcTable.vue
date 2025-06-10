<template>
  <BTableLite
    :fields="tableFields"
    :items="computedTableItems"
    :dark="true"
    :striped="true"
    :tbody-tr-class="bodyTrClasses"
  >
    <template #cell(day)="{ value, index }">
      <BFormInput
        :model-value="value as string"
        @update:model-value="(val) => $emit('update:workDays-day', index, String(val))"
      ></BFormInput>
    </template>

    <template #cell(arrived)="{ value, index }">
      <BInputGroup>
        <BFormInput
          :model-value="value as string"
          @update:model-value="
            (val) => $emit('update:workDays-from', index, typeof val === 'string' && val.length ? val : null)
          "
        ></BFormInput>
        <template #append>
          <BButton @click="$emit('update:workDays-from', index, currentTime())">
            <font-awesome-icon :icon="['fas', 'clock']" />
          </BButton>
        </template>
      </BInputGroup>
    </template>

    <template #cell(left)="{ value, index }">
      <BInputGroup>
        <BFormInput
          :model-value="value as string"
          :disabled="tracking[index]"
          @update:model-value="
            (val) => $emit('update:workDays-to', index, typeof val === 'string' && val.length ? val : null)
          "
        ></BFormInput>
        <template #append>
          <BButton @click="$emit('update:workDays-to', index, currentTime())">
            <font-awesome-icon :icon="['fas', 'clock']" />
          </BButton>
          <BButton
            v-if="!tracking[index] && (computedWorkDays[index].to ?? '') === ''"
            @click="
              () => {
                $emit('update:workDays-to', index, currentTime())
                $emit('update:workDays-tracking', index, true)
              }
            "
          >
            <font-awesome-icon :icon="['fas', 'hourglass-start']" />
          </BButton>
          <BButton
            v-else-if="tracking[index]"
            variant="primary"
            @click="$emit('update:workDays-tracking', index, false)"
          >
            <font-awesome-icon :icon="['fas', 'hourglass-half']" />
          </BButton>
          <BButton v-else disabled>
            <font-awesome-icon :icon="['fas', 'hourglass-end']" />
          </BButton>
        </template>
      </BInputGroup>
    </template>

    <template #cell(subtracted_time)="{ value, index }">
      <BInputGroup>
        <BFormInput
          :disabled="!customSubtractedTime[index]"
          :model-value="value as string"
          @update:model-value="
            (val) => $emit('update:workDays-subtractedTime', index, typeof val === 'string' && val.length ? val : null)
          "
        ></BFormInput>

        <template #prepend>
          <BButton @click="$emit('toggleCustomSubtractedTime', index)">
            <font-awesome-layers fixed-width>
              <font-awesome-icon
                v-if="!customSubtractedTime[index]"
                :icon="['fas', 'slash']"
                transform="down-1 left-1"
              />
              <font-awesome-icon
                v-if="!customSubtractedTime[index]"
                :icon="['fas', 'slash']"
                :mask="['fas', 'pen-to-square']"
              />
              <font-awesome-icon v-if="customSubtractedTime[index]" :icon="['fas', 'pen-to-square']" />
            </font-awesome-layers>
          </BButton>
        </template>
      </BInputGroup>
    </template>

    <template #cell(notes)="{ value, index }">
      <BFormInput
        :model-value="value as string"
        @update:model-value="
          (val) => $emit('update:workDays-notes', index, typeof val === 'string' && val.length ? val : null)
        "
      ></BFormInput>
    </template>

    <template #cell(add_sub)="{ index }">
      <b-button @click="$emit('addRowAfter', index)">
        <font-awesome-icon :icon="['fas', 'plus']" />
      </b-button>
      <b-button v-if="computedWorkDays.length > 1" @click="$emit('removeRow', index)">
        <font-awesome-icon :icon="['fas', 'minus']" />
      </b-button>
    </template>
  </BTableLite>
</template>

<script setup lang="ts">
import {
  BButton,
  BFormInput,
  BInputGroup,
  BTableLite,
  type TableField,
  type TableRowType,
  type TableStrictClassValue
} from 'bootstrap-vue-next'
import { computed, type ComputedRef, type PropType, ref, watchSyncEffect } from 'vue'
import type { ComputedWorkEntries } from '@/ComputeWorkTime'

const props = defineProps({
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

const tableFields: ComputedRef<TableField[]> = computed(() => {
  if (props.mode === 'hours') {
    return [
      {
        key: 'day',
        label: 'Day',
        thStyle: 'min-width: 130px',
      },
      {
        key: 'arrived',
        label: 'Arrived',
        thStyle: 'min-width: 120px',
      },
      {
        key: 'left',
        label: 'Left',
        thStyle: 'min-width: 160px',
      },
      {
        key: 'worked_time',
        label: 'Worked time',
        thStyle: 'min-width: 60px',
      },
      {
        key: 'extra_time',
        label: 'Extra time',
        thStyle: 'min-width: 60px',
      },
      {
        key: 'lost_time',
        label: 'Lost time',
        thStyle: 'min-width: 60px',
      },
      {
        key: 'estimate',
        label: 'Estimate?',
        thStyle: 'min-width: 40px',
      },
      {
        key: 'subtracted_time',
        label: 'Subtracted time',
        thStyle: 'min-width: 125px',
      },
      {
        key: 'notes',
        label: 'Notes',
        thStyle: 'min-width: 200px',
      },
      {
        key: 'add_sub',
        label: 'Add/Remove row',
        thStyle: 'min-width: 100px',
      },
    ]
  } else {
    return [
      {
        key: 'day',
        label: 'Task',
        thStyle: 'min-width: 130px',
      },
      {
        key: 'arrived',
        label: 'From',
        thStyle: 'min-width: 120px',
      },
      {
        key: 'left',
        label: 'To',
        thStyle: 'min-width: 160px',
      },
      {
        key: 'worked_time',
        label: 'Worked time',
        thStyle: 'min-width: 60px',
      },
      {
        key: 'extra_time',
        label: 'Total time',
        thStyle: 'min-width: 60px',
      },
      {
        key: 'subtracted_time',
        label: 'Subtracted time',
        thStyle: 'min-width: 125px',
      },
      {
        key: 'notes',
        label: 'Notes',
        thStyle: 'min-width: 200px',
      },
      {
        key: 'add_sub',
        label: 'Add/Remove row',
        thStyle: 'min-width: 100px',
      },
    ]
  }
})

interface TableItem {
  day: string
  arrived: string | undefined
  left: string | undefined
  worked_time: string
  extra_time: string
  lost_time: string
  estimate: boolean
  subtracted_time: string
  notes: string
  add_sub: string
}

function bodyTrClasses(item: TableItem | null, type: TableRowType): TableStrictClassValue {
  if (type === 'row' && item) {
    const day = item.day as string
    const idx = props.computedWorkDays.findIndex((v) => v.day === day)
    if (idx > 0) {
      const prevDay = props.computedWorkDays[idx - 1].day
      if (new Date(day).getDate() - new Date(prevDay).getDate() > 1) {
        return 'table-group-divider'
      }
    }
  }

  return {}
}

const computedTableItems = ref<
  {
    day: string
    arrived: string | undefined
    left: string | undefined
    worked_time: string
    extra_time: string
    lost_time: string
    estimate: boolean
    subtracted_time: string
    notes: string
    add_sub: string
  }[]
>([])
watchSyncEffect(() => {
  try {
    computedTableItems.value = props.computedWorkDays.map((entry) => ({
      day: entry.day,
      arrived: entry.from ?? undefined,
      left: entry.to ?? undefined,
      worked_time: entry.workedTime,
      // time_diff: entry.timeDiff,
      extra_time: entry.extraTime,
      lost_time: entry.lostTime,
      estimate: entry.estimate,
      subtracted_time: entry.subtractedTime,
      notes: entry.notes,
      add_sub: '',
    }))
  } catch (e) {
    // Ignored
  }
})

function dateToTimeString(d: Date) {
  const hours = d.getHours().toString(10).padStart(2, '0')
  const minutes = d.getMinutes().toString(10).padStart(2, '0')
  return `${hours}:${minutes}`
}

function currentTime() {
  return dateToTimeString(new Date())
}
</script>
