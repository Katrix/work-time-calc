<template>
  <table class="table table-dark table-striped">
    <thead>
      <tr v-if="calcInfo.calc.mode === 'hours'">
        <th scope="col" style="min-width: 8em">Day</th>
        <th scope="col" style="min-width: 8em; max-width: 12em; width: 12em">Arrived</th>
        <th scope="col" style="min-width: 11em; max-width: 12em; width: 12em">Left</th>
        <th scope="col" style="min-width: 4em; max-width: 8em; width: 8em">Worked time</th>
        <th scope="col" style="min-width: 4em; max-width: 8em; width: 8em">Extra time</th>
        <th scope="col" style="min-width: 8em; max-width: 12em; width: 12em">Subtracted time</th>
        <th scope="col" style="min-width: 8em">Notes</th>
        <th scope="col" style="min-width: 8em; max-width: 8em; width: 8em">Add/Remove row</th>
      </tr>
      <tr v-else>
        <th scope="col" style="min-width: 8em">Task</th>
        <th scope="col" style="min-width: 8em; width: 12em; max-width: 12em">From</th>
        <th scope="col" style="min-width: 11em; width: 12em; max-width: 12em">To</th>
        <th scope="col" style="min-width: 4em; width: 8em; max-width: 8em">Worked time</th>
        <th scope="col" style="min-width: 4em; width: 8em; max-width: 8em">Total time</th>
        <th scope="col" style="min-width: 4em; max-width: 10em">Tags</th>
        <th scope="col" style="min-width: 8em">Notes</th>
        <th scope="col" style="min-width: 8em; max-width: 8em; width: 8em">Add/Remove row</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(item, index) in calcInfo.calc.entries" :class="trClasses(item)">
        <td>
          <CalcInputName
            v-model="item.name"
            :mode="calcInfo.calc.mode"
            @on-autocomplete-issue="(notes) => (item.notes = notes)"
          />
        </td>

        <td><CalcInputFrom :precision="calcInfo.calc.precision" v-model="item.from" /></td>
        <td>
          <CalcInputTo :precision="calcInfo.calc.precision" v-model:to="item.to" v-model:is-tracking="item.isTracking" />
        </td>

        <td>
          {{ calcInfo.computedCalc?.entries?.[index] ? calcInfo.computedCalc.entries[index].workedTime : '' }}
        </td>
        <td>
          {{ calcInfo.computedCalc?.entries?.[index] ? calcInfo.computedCalc.entries[index].extraTime : '' }}
        </td>

        <td v-if="calcInfo.calc.mode === 'hours'">
          <CalcInputSubtractedTime v-model="item.subtractedTime" />
        </td>

        <!-- Tags -->
        <td v-if="calcInfo.calc.mode === 'tasks'" style="max-width: 160px">
          <TagBadge
            v-for="tag in item.tags ?? []"
            :key="tag"
            :tag="tag"
            :calc-info="calcInfo"
            @delete-tag="calcInfo.removeTag(index, tag)"
          />
          <TagDropdown :calc-info="calcInfo" :existing-tags="item.tags ?? []" @new-tag="(tag) => calcInfo.addTag(index, tag)" />
        </td>

        <td><BFormInput v-model="calcInfo.calc.entries[index].notes" /></td>

        <!-- Add/Remove row -->
        <td>
          <button class="btn btn-secondary" @click="calcInfo.addRowAfter(index)">
            <FontAwesomeIcon :icon="['fas', 'plus']" />
          </button>
          <button class="btn btn-secondary" v-if="calcInfo.calc.entries.length > 1" @click="calcInfo.removeRow(index)">
            <FontAwesomeIcon :icon="['fas', 'minus']" />
          </button>
        </td>
      </tr>
    </tbody>
  </table>

  <CalcTagSummary :calc-info="calcInfo" :tag-summaries="calcInfo.computedCalc?.summaryByTag ?? {}" />
</template>

<script setup lang="ts">
const props = defineProps<{ calcInfo: CalcInfo }>()

function trClasses(item: CalcEntry): string | null {
  const name = item.name
  const idx = props.calcInfo.calc.entries.findIndex((v) => v.name === name)
  if (idx > 0) {
    const prevName = props.calcInfo.calc.entries[idx - 1].name
    if (new Date(name).getDate() - new Date(prevName).getDate() > 1) {
      return 'table-group-divider'
    }
  }

  return null
}
</script>
