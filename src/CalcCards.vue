<template>
  <BCard v-for="(item, index) in entriesStore.computedWorkDays" :key="item.day + index" class="mb-4">
    <template #header>
      <BFormInput v-model="entriesStore.entries[index].day" />
    </template>

    <BCardText>
      <BFormGroup label="Arrived:">
        <BInputGroup>
          <BFormInput v-model="entriesStore.entries[index].from" />
          <template #append>
            <BButton @click="entriesStore.entries[index].from = currentTime(settingsStore.precision)">
              <font-awesome-icon :icon="['fas', 'clock']" />
            </BButton>
          </template>
        </BInputGroup>
      </BFormGroup>

      <BFormGroup label="Left:" class="mb-2">
        <BInputGroup>
          <BFormInput v-model="entriesStore.entries[index].to" />
          <template #append>
            <BButton @click="entriesStore.entries[index].to = currentTime(settingsStore.precision)">
              <font-awesome-icon :icon="['fas', 'clock']" />
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
              <font-awesome-icon :icon="['fas', 'hourglass-start']" />
            </BButton>
            <BButton
              v-else-if="entriesStore.entries[index].isTracking"
              variant="primary"
              @click="entriesStore.entries[index].isTracking = false"
            >
              <font-awesome-icon :icon="['fas', 'hourglass-half']" />
            </BButton>
            <BButton v-else disabled>
              <font-awesome-icon :icon="['fas', 'hourglass-end']" />
            </BButton>
          </template>
        </BInputGroup>
      </BFormGroup>

      <dl class="row">
        <dt class="col-5">Worked time:</dt>
        <dd class="col-7">{{ item.workedTime }}</dd>
        <dt class="col-5">Extra time:</dt>
        <dd class="col-7">{{ item.extraTime }}</dd>
        <dt class="col-5">Estimate?:</dt>
        <dd class="col-7">{{ item.estimate }}</dd>
      </dl>

      <BFormGroup v-if="settingsStore.mode !== 'tasks'" label="Subtracted time:">
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
      </BFormGroup>

      <BFormGroup label="Notes:">
        <BFormTextarea v-model="entriesStore.entries[index].notes" />
      </BFormGroup>
    </BCardText>

    <template #footer>
      <BButton @click="entriesStore.addRowAfter(index)">
        <FontAwesomeIcon :icon="['fas', 'plus']" />
      </BButton>
      <BButton v-if="entriesStore.entries.length > 1" @click="entriesStore.removeRow(index)">
        <FontAwesomeIcon :icon="['fas', 'minus']" />
      </BButton>
    </template>
  </BCard>
</template>

<script setup lang="ts">
import { BButton, BCard, BCardText, BFormGroup, BFormInput, BInputGroup, BFormTextarea } from 'bootstrap-vue-next'
import { currentTime } from '@/ComputeWorkTime'
import { useEntriesStore } from '@/entriesStore.ts'
import { useSettingsStore } from '@/settingsStore.ts'
import { computed } from 'vue'
import { FontAwesomeIcon, FontAwesomeLayers } from '@fortawesome/vue-fontawesome'

const props = defineProps<{ storeId: string }>()

const settingsStore = computed(() => useSettingsStore(props.storeId))
const entriesStore = computed(() => useEntriesStore(props.storeId))
</script>
