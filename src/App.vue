<template>
  <b-container>
    <h1>Work time calc</h1>

    <BForm>
      <div class="row">
        <label class="col-lg-1 col-form-label" for="savedUpTimeInput">Saved up time:</label>
        <div class="col-lg-1">
          <BFormInput id="savedUpTimeInput" class="mb-2 me-sm-2 mb-sm-0" v-model="savedUp"></BFormInput>
        </div>

        <label class="col-lg-1 col-form-label" for="workTimeInput">Work time:</label>
        <div class="col-lg-1">
          <BFormInput id="workTimeInput" class="mb-2 me-sm-2 mb-sm-0" v-model="workTime"></BFormInput>
        </div>

        <label class="col-lg-1 col-form-label" for="defaultWorkFromInput">Default work from:</label>
        <div class="col-lg-1">
          <BFormInput id="defaultWorkFromInput" class="mb-2 me-sm-2 mb-sm-0" v-model="defaultFrom"></BFormInput>
        </div>

        <label class="col-lg-1 col-form-label" for="defaultWorkToInput">Default work to:</label>
        <div class="col-lg-1">
          <BFormInput id="defaultWorkToInput" class="mb-2 me-sm-2 mb-sm-0" v-model="defaultTo"></BFormInput>
        </div>

        <div class="col-lg-3">
          <BFormFile accept="application/json" v-model="saveFile"></BFormFile>
        </div>

        <BButtonGroup class="col-lg-1">
          <BButton type="button" variant="danger" @click="clear"> Clear </BButton>
          <BButton type="button" @click="load"> Load </BButton>
          <BButton type="button" @click="save"> Save </BButton>
        </BButtonGroup>
      </div>
    </BForm>

    <hr />

    <BTableLite :fields="tableFields" :items="computedTableItems" dark="true" striped="true" :tbody-tr-class="bodyTrClasses">
      <template #cell(day)="{ value, index }">
        <BFormInput
          :model-value="value as string"
          @update:model-value="(val) => (workDays[index].day = val)"
        ></BFormInput>
      </template>

      <template #cell(arrived)="{ value, index }">
        <BFormInput
          :model-value="value as string"
          @update:model-value="(val) => (workDays[index].from = val.length ? val : null)"
        ></BFormInput>
      </template>

      <template #cell(left)="{ value, index }">
        <BFormInput
          :model-value="value as string"
          @update:model-value="(val) => (workDays[index].to = val.length ? val : null)"
        ></BFormInput>
      </template>

      <template #cell(notes)="{ value, index }">
        <BFormInput
          :model-value="value as string"
          @update:model-value="(val) => (workDays[index].notes = val.length ? val : null)"
        ></BFormInput>
      </template>

      <template #cell(add_sub)="{ index }">
        <b-button @click="addRowAfter(index)">
          <font-awesome-icon :icon="['fas', 'plus']" />
        </b-button>
        <b-button v-if="index != 0" @click="removeRow(index)">
          <font-awesome-icon :icon="['fas', 'minus']" />
        </b-button>
      </template>
    </BTableLite>
  </b-container>
</template>

<script setup lang="ts">
import {
  BFormInput,
  BFormFile,
  BTableLite,
  BButton,
  BButtonGroup,
  BContainer,
  type TableField, type TableItem
} from "bootstrap-vue-next";
import { ref, watchSyncEffect } from 'vue'

import { computeWorkTime, type WorkDays, type WorkRange } from '@/ComputeWorkTime'

const savedUp = ref('00:00')
const workTime = ref('08:00')
const defaultFrom = ref('08:45')
const defaultTo = ref('18:00')

function currentDate() {
  const isoStr = new Date().toISOString()
  return isoStr.substring(0, isoStr.search('T'))
}

const workDays = ref<(WorkRange & { day: string })[]>([{ day: currentDate(), from: defaultFrom.value, to: defaultTo.value }])

function addRowAfter(idx: number) {
  const prevDay = workDays.value[idx]
  const day = prevDay ? prevDay.day : currentDate()
  workDays.value.splice(idx + 1, 0, { day, from: defaultFrom.value, to: defaultTo.value })
}

function removeRow(idx: number) {
  workDays.value.splice(idx, 1)
}

function clear() {
  workDays.value = [{ day: currentDate(), from: defaultFrom.value, to: defaultTo.value }]
}

const tableFields: TableField[] = [
  {
    key: 'day',
    label: 'Day',
    thStyle: 'min-width: 130px'
  },
  {
    key: 'arrived',
    label: 'Arrived',
    thStyle: 'min-width: 80px'
  },
  {
    key: 'left',
    label: 'Left',
    thStyle: 'min-width: 80px'
  },
  {
    key: 'worked_time',
    label: 'Worked time',
    thStyle: 'min-width: 80px'
  },
  {
    key: 'extra_time',
    label: 'Extra time',
    thStyle: 'min-width: 80px'
  },
  {
    key: 'lost_time',
    label: 'Lost time',
    thStyle: 'min-width: 80px'
  },
  {
    key: 'estimate',
    label: 'Is estimate',
    thStyle: 'min-width: 90px'
  },
  {
    key: 'subtracted_time',
    label: 'Subtracted time',
    thStyle: 'min-width: 80px'
  },
  {
    key: 'notes',
    label: 'Notes',
    thStyle: 'min-width: 300px'
  },
  {
    key: 'add_sub',
    label: 'Add/Remove row',
    thStyle: 'min-width: 70px'
  },
]

const computedTableItems = ref<
  {
    day: string
    arrived: string
    left: string
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
  const workDaysObj: WorkDays = {}
  for (const workDay of workDays.value) {
    if (workDay) {
      if (!workDaysObj[workDay.day]) {
        workDaysObj[workDay.day] = []
      }
      workDaysObj[workDay.day].push(workDay)
    }
  }

  try {
    const computedWorkDays = computeWorkTime(
      workDaysObj,
      savedUp.value,
      defaultFrom.value,
      defaultTo.value,
      workTime.value,
    )

    computedTableItems.value = computedWorkDays.map((entry) => ({
      day: entry.day,
      arrived: entry.from,
      left: entry.to,
      worked_time: entry.workedTime,
      extra_time: entry.extraTime,
      lost_time: entry.lostTime,
      estimate: entry.estimate,
      subtracted_time: entry.subtractedTime,
      notes: entry.notes,
      add_sub: '',
    }))
  } catch (e) {
    //Ignored
  }
})

function bodyTrClasses(item: TableItem, type: string) {
  if (type === 'row') {
    const day = item.day as string
    const idx = workDays.value.findIndex(v => v.day === day)
    if (idx > 0) {
      const prevDay = workDays.value[idx - 1].day
      if (new Date(day).getDate() - new Date(prevDay).getDate() > 1) {
        return "table-group-divider"
      }
    }
  }

  return null
}

const saveFile = ref<null | File>(null)

async function load() {
  const file = saveFile.value
  if (file) {
    const text = await file.text()
    const json = JSON.parse(text)
    savedUp.value = json.savedUp
    workTime.value = json.workTime
    defaultFrom.value = json.defaultFrom
    defaultTo.value = json.defaultTo
    workDays.value = json.workDays
  }
}

function save() {
  const data = {
    savedUp: savedUp.value,
    workTime: workTime.value,
    defaultFrom: defaultFrom.value,
    defaultTo: defaultTo.value,
    workDays: workDays.value,
  }

  //https://stackoverflow.com/questions/13405129/create-and-save-a-file-with-javascript
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  const a = document.createElement('a')
  const url = URL.createObjectURL(blob)
  a.href = url
  a.download = saveFile.value?.name ?? 'data.json'
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 0)
}
</script>