<template>
  <table class="table table-dark table-striped">
    <thead>
      <tr v-if="calc.mode === 'hours'">
        <th scope="col" style="min-width: 130px">Day</th>
        <th scope="col" style="min-width: 120px">Arrived</th>
        <th scope="col" style="min-width: 160px">Left</th>
        <th scope="col" style="min-width: 60px">Worked time</th>
        <th scope="col" style="min-width: 60px">Extra time</th>
        <th scope="col" style="min-width: 125px">Subtracted time</th>
        <th scope="col" style="min-width: 200px">Notes</th>
        <th scope="col" style="min-width: 100px">Add/Remove row</th>
      </tr>
      <tr v-else>
        <th scope="col" style="min-width: 240px">Task</th>
        <th scope="col" style="min-width: 120px">From</th>
        <th scope="col" style="min-width: 160px">To</th>
        <th scope="col" style="min-width: 60px">Worked time</th>
        <th scope="col" style="min-width: 60px">Total time</th>
        <th scope="col" style="min-width: 60px; max-width: 160px">Tags</th>
        <th scope="col" style="min-width: 200px">Notes</th>
        <th scope="col" style="min-width: 100px">Add/Remove row</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(item, index) in calc.entries" :class="trClasses(item)">
        <td><BFormInput v-model="item.day"></BFormInput></td>

        <td><CalcInputFrom :precision="calc.precision" v-model="item.from" /></td>
        <td>
          <CalcInputTo :precision="calc.precision" v-model:to="item.to" v-model:is-tracking="item.isTracking" />
        </td>

        <td>
          {{ computedCalc?.entries?.[index] ? computedCalc.entries[index].workedTime : '' }}
        </td>
        <td>
          {{ computedCalc?.entries?.[index] ? computedCalc.entries[index].extraTime : '' }}
        </td>

        <td v-if="calc.mode === 'hours'">
          <CalcInputSubtractedTime
            v-model:subtracted-time="item.subtractedTime"
            v-model:custom-subtracted-time="item.customSubtractedTime"
          ></CalcInputSubtractedTime>
        </td>

        <!-- Tags -->
        <td v-if="calc.mode === 'tasks'" style="max-width: 160px">
          <TagBadge
            v-for="tag in item.tags ?? []"
            :key="tag"
            :tag="tag"
            :calc-id="calcId"
            @delete-tag="removeTag(index, tag)"
          />
          <TagDropdown :calc-id="calcId" :existing-tags="item.tags ?? []" @new-tag="(tag) => addTag(index, tag)" />
        </td>

        <td><BFormInput v-model="calc.entries[index].notes" /></td>

        <!-- Add/Remove row -->
        <td>
          <button class="btn btn-secondary" @click="addRowAfter(index)">
            <FontAwesomeIcon :icon="['fas', 'plus']" />
          </button>
          <button class="btn btn-secondary" v-if="calc.entries.length > 1" @click="removeRow(index)">
            <FontAwesomeIcon :icon="['fas', 'minus']" />
          </button>
        </td>
      </tr>
    </tbody>
  </table>

  <CalcTagSummary :calcId="calcId" :tag-summaries="computedCalc?.value?.summaryByTag ?? {}" />
</template>

<script setup lang="ts">
const props = defineProps<{ calcId: string }>()
const calcStore = useCalcStore()
const { calc, computedCalc, addTag, removeTag, addRowAfter, removeRow } = calcStore.useCalc(
  computed(() => props.calcId),
)

function trClasses(item: WorkRange): string | null {
  const day = item.day
  const idx = calc.value.entries.findIndex((v) => v.day === day)
  if (idx > 0) {
    const prevDay = calc.value.entries[idx - 1].day
    if (new Date(day).getDate() - new Date(prevDay).getDate() > 1) {
      return 'table-group-divider'
    }
  }

  return null
}
</script>
