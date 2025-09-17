<template>
  <table class="table table-dark table-striped">
    <thead>
      <tr v-if="settingsStore.mode === 'hours'">
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
      <tr v-for="(item, index) in entriesStore.entries" :class="trClasses(item)">
        <td><BFormInput v-model="item.day"></BFormInput></td>

        <td><CalcInputFrom :store-id="storeId" :precision="settingsStore.precision" v-model="item.from" /></td>
        <td>
          <CalcInputTo
            :store-id="storeId"
            :precision="settingsStore.precision"
            v-model:to="item.to"
            v-model:is-tracking="item.isTracking"
          />
        </td>

        <td>{{ entriesStore.computedWorkDays[index].workedTime }}</td>
        <td>{{ entriesStore.computedWorkDays[index].extraTime }}</td>

        <td v-if="settingsStore.mode === 'hours'">
          <CalcInputSubtractedTime
            v-model:subtracted-time="item.subtractedTime"
            v-model:custom-subtracted-time="item.customSubtractedTime"
          ></CalcInputSubtractedTime>
        </td>

        <!-- Tags -->
        <td v-if="settingsStore.mode === 'tasks'" style="max-width: 160px">
          <TagBadge
            v-for="tag in item.tags ?? []"
            :key="tag"
            :tag="tag"
            :store-id="storeId"
            @delete-tag="entriesStore.removeTag(index, tag)"
          />
          <TagDropdown
            :store-id="storeId"
            :existing-tags="item.tags ?? []"
            @new-tag="(tag) => entriesStore.addTag(index, tag)"
          />
        </td>

        <td><BFormInput v-model="entriesStore.entries[index].notes" /></td>

        <!-- Add/Remove row -->
        <td>
          <button class="btn btn-secondary" @click="entriesStore.addRowAfter(index)">
            <FontAwesomeIcon :icon="['fas', 'plus']" />
          </button>
          <button
            class="btn btn-secondary"
            v-if="entriesStore.entries.length > 1"
            @click="entriesStore.removeRow(index)"
          >
            <FontAwesomeIcon :icon="['fas', 'minus']" />
          </button>
        </td>
      </tr>
    </tbody>
  </table>

  <CalcTagSummary :storeId="storeId" :tag-summaries="entriesStore.tagSummaries" />
</template>

<script setup lang="ts">
import CalcInputFrom from '~/components/calc/input/CalcInputFrom.vue'
import CalcInputTo from '~/components/calc/input/CalcInputTo.vue'

const props = defineProps<{ storeId: string }>()

const settingsStore = computed(() => useSettingsStore(props.storeId))
const entriesStore = computed(() => useEntriesStore(props.storeId))

function trClasses(item: WorkRange): string | null {
  const day = item.day
  const idx = entriesStore.value.entries.findIndex((v) => v.day === day)
  if (idx > 0) {
    const prevDay = entriesStore.value.entries[idx - 1].day
    if (new Date(day).getDate() - new Date(prevDay).getDate() > 1) {
      return 'table-group-divider'
    }
  }

  return null
}

const hasTagSummary = computed(() => Object.entries(entriesStore.value.tagSummaries).length > 0)
</script>
