<template>
  <BTableLite
    :fields="tableFields"
    :items="computedTableItems"
    :dark="true"
    :striped="true"
    :tbody-tr-class="bodyTrClasses"
  >
    <template #cell(day)="{ index }">
      <BFormInput v-model="entriesStore.entries[index].day"></BFormInput>
    </template>

    <template #cell(arrived)="{ index }">
      <BInputGroup>
        <BFormInput v-model="entriesStore.entries[index].from" />
        <template #append>
          <BButton @click="entriesStore.entries[index].from = currentTime(settingsStore.precision)">
            <FontAwesomeIcon :icon="['fas', 'clock']" />
          </BButton>
        </template>
      </BInputGroup>
    </template>

    <template #cell(left)="{ index }">
      <BInputGroup>
        <BFormInput v-model="entriesStore.entries[index].to" :disabled="entriesStore.entries[index].isTracking" />
        <template #append>
          <BButton @click="entriesStore.entries[index].to = currentTime(settingsStore.precision)">
            <FontAwesomeIcon :icon="['fas', 'clock']" />
          </BButton>
          <BButton
            v-if="!entriesStore.entries[index].isTracking && (entriesStore.entries[index].to ?? '') === ''"
            @click="
              () => {
                entriesStore.entries[index].to = currentTime(settingsStore.precision)
                entriesStore.entries[index].isTracking = true
              }
            "
          >
            <FontAwesomeIcon :icon="['fas', 'hourglass-start']" />
          </BButton>
          <BButton
            v-else-if="entriesStore.entries[index].isTracking"
            variant="primary"
            @click="entriesStore.entries[index].isTracking = false"
          >
            <FontAwesomeIcon :icon="['fas', 'hourglass-half']" />
          </BButton>
          <BButton v-else disabled>
            <FontAwesomeIcon :icon="['fas', 'hourglass-end']" />
          </BButton>
        </template>
      </BInputGroup>
    </template>

    <template #cell(subtracted_time)="{ index }">
      <BInputGroup>
        <BFormInput
          :disabled="!entriesStore.entries[index].customSubtractedTime"
          v-model="entriesStore.entries[index].subtractedTime"
        />

        <template #prepend>
          <BButton
            @click="
              () => {
                entriesStore.entries[index].customSubtractedTime = !entriesStore.entries[index].customSubtractedTime
                entriesStore.entries[index].subtractedTime = null
              }
            "
          >
            <FontAwesomeLayers fixed-width>
              <FontAwesomeIcon
                v-if="!entriesStore.entries[index].customSubtractedTime"
                :icon="['fas', 'slash']"
                transform="down-1 left-1"
              />
              <FontAwesomeIcon
                v-if="!entriesStore.entries[index].customSubtractedTime"
                :icon="['fas', 'slash']"
                :mask="['fas', 'pen-to-square']"
              />
              <FontAwesomeIcon
                v-if="entriesStore.entries[index].customSubtractedTime"
                :icon="['fas', 'pen-to-square']"
              />
            </FontAwesomeLayers>
          </BButton>
        </template>
      </BInputGroup>
    </template>

    <template #cell(notes)="{ index }">
      <BFormInput v-model="entriesStore.entries[index].notes" />
    </template>

    <template #cell(add_sub)="{ index }">
      <BButton @click="entriesStore.addRowAfter(index)">
        <FontAwesomeIcon :icon="['fas', 'plus']" />
      </BButton>
      <BButton v-if="entriesStore.entries.length > 1" @click="entriesStore.removeRow(index)">
        <FontAwesomeIcon :icon="['fas', 'minus']" />
      </BButton>
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
  type TableStrictClassValue,
} from 'bootstrap-vue-next'
import { computed, type ComputedRef, ref, watchSyncEffect } from 'vue'
import { FontAwesomeIcon, FontAwesomeLayers } from '@fortawesome/vue-fontawesome'
import { currentTime } from '@/ComputeWorkTime'
import { useEntriesStore } from '@/entriesStore.ts'
import { useSettingsStore } from '@/settingsStore.ts'

const props = defineProps<{ storeId: string }>()

const settingsStore = computed(() => useSettingsStore(props.storeId))
const entriesStore = computed(() => useEntriesStore(props.storeId))

const tableFields: ComputedRef<TableField[]> = computed(() => {
  if (settingsStore.value.mode === 'hours') {
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
        thStyle: 'min-width: 240px',
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
    const idx = entriesStore.value.entries.findIndex((v) => v.day === day)
    if (idx > 0) {
      const prevDay = entriesStore.value.entries[idx - 1].day
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
    estimate: boolean
    subtracted_time: string
    notes: string
    add_sub: string
  }[]
>([])
watchSyncEffect(() => {
  try {
    computedTableItems.value = entriesStore.value.computedWorkDays.map((entry) => ({
      day: entry.day,
      arrived: entry.from ?? undefined,
      left: entry.to ?? undefined,
      worked_time: entry.workedTime,
      extra_time: entry.extraTime,
      estimate: entry.estimate,
      subtracted_time: entry.subtractedTime,
      notes: entry.notes,
      add_sub: '',
    }))
  } catch (e) {
    // Ignored
  }
})
</script>
