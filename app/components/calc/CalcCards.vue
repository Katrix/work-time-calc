<template>
  <div v-for="(item, index) in entriesStore.entries" :key="item.day + index" class="card mb-4">
    <div class="card-header">
      <BFormInput v-model="item.day" />
    </div>

    <div class="card-body">
      <div class="card-text">
        <BFormGroup label="Arrived:">
          <CalcInputFrom :store-id="storeId" :precision="settingsStore.precision" v-model="item.from" />
        </BFormGroup>

        <BFormGroup label="Left:" class="mb-2">
          <CalcInputTo
            :store-id="storeId"
            :precision="settingsStore.precision"
            v-model:to="item.to"
            v-model:is-tracking="item.isTracking"
          />
        </BFormGroup>

        <dl class="row">
          <dt class="col-5">Worked time:</dt>
          <dd class="col-7">{{ entriesStore.computedWorkDays[index].workedTime }}</dd>
          <dt class="col-5">Extra time:</dt>
          <dd class="col-7">{{ entriesStore.computedWorkDays[index].extraTime }}</dd>
          <dt class="col-5">Estimate?:</dt>
          <dd class="col-7">{{ entriesStore.computedWorkDays[index].estimate }}</dd>
        </dl>

        <BFormGroup v-if="settingsStore.mode !== 'tasks'" label="Subtracted time:">
          <CalcInputSubtractedTime
            v-model:subtracted-time="item.subtractedTime"
            v-model:custom-subtracted-time="item.customSubtractedTime"
          ></CalcInputSubtractedTime>
        </BFormGroup>

        <BFormGroup label="Notes:">
          <!-- FIXME: This fails on page reload in dev mode if it's not Lazy and I'm checking responsive dev mode -->
          <LazyBFormTextarea v-model="item.notes" />
        </BFormGroup>

        <template v-if="settingsStore.mode === 'tasks'">
          Tags:
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
        </template>
      </div>
    </div>

    <div class="card-footer">
      <button class="btn btn-secondary" @click="entriesStore.addRowAfter(index)">
        <FontAwesomeIcon :icon="['fas', 'plus']" />
      </button>
      <button class="btn btn-secondary" v-if="entriesStore.entries.length > 1" @click="entriesStore.removeRow(index)">
        <FontAwesomeIcon :icon="['fas', 'minus']" />
      </button>
    </div>
  </div>

  <CalcTagSummary :storeId="storeId" :tag-summaries="entriesStore.tagSummaries" />
</template>

<script setup lang="ts">
import CalcInputFrom from '~/components/calc/input/CalcInputFrom.vue'
import CalcInputTo from '~/components/calc/input/CalcInputTo.vue'

const props = defineProps<{ storeId: string }>()

const settingsStore = computed(() => useSettingsStore(props.storeId))
const entriesStore = computed(() => useEntriesStore(props.storeId))

const hasTagSummary = computed(() => Object.entries(entriesStore.value.tagSummaries).length > 0)
</script>
