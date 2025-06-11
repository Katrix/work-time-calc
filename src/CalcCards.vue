<template>
  <BCard v-for="(item, index) in computedWorkDays" :key="item.day + index" class="mb-4">
    <template #header>
      <BFormInput
        :model-value="item.day"
        @update:model-value="(val) => $emit('update:workDays-day', index, val)"
      ></BFormInput>
    </template>

    <BCardText>
      <BFormGroup label="Arrived:">
        <BInputGroup>
          <BFormInput
            :model-value="item.from"
            @update:model-value="
              (val) => $emit('update:workDays-from', index, typeof val === 'string' && val.length ? val : null)
            "
          >
          </BFormInput>
          <template #append>
            <BButton @click="$emit('update:workDays-from', index, currentTime(precision))">
              <font-awesome-icon :icon="['fas', 'clock']" />
            </BButton>
          </template>
        </BInputGroup>
      </BFormGroup>

      <BFormGroup label="Left:" class="mb-2">
        <BInputGroup>
          <BFormInput
            :model-value="item.to"
            @update:model-value="(val) => $emit('update:workDays-to', index, typeof val === 'string' && val.length ? val : null)"
          >
          </BFormInput>
          <template #append>
            <BButton @click="$emit('update:workDays-to', index, currentTime(precision))">
              <font-awesome-icon :icon="['fas', 'clock']" />
            </BButton>
            <BButton
              v-if="!tracking[index] && (computedWorkDays[index].to ?? '') === ''"
              @click="
                () => {
                  $emit('update:workDays-to', index, currentTime(precision))
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
      </BFormGroup>

      <dl class="row">
        <dt class="col-5">Worked time:</dt>
        <dd class="col-7">{{ item.workedTime }}</dd>
        <dt class="col-5">Extra time:</dt>
        <dd class="col-7">{{ item.extraTime }}</dd>
        <dt class="col-5">Lost time:</dt>
        <dd class="col-7">{{ item.lostTime }}</dd>
        <dt class="col-5">Estimate?:</dt>
        <dd class="col-7">{{ item.estimate }}</dd>
      </dl>

      <BFormGroup label="Subtracted time:">
        <BInputGroup>
          <BFormInput
            :disabled="!customSubtractedTime[index]"
            :model-value="item.subtractedTime"
            @update:model-value="(val) => $emit('update:workDays-subtractedTime', index, typeof val === 'string' && val.length ? val : null)"
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
      </BFormGroup>

      <BFormGroup label="Notes:">
        <BFormTextarea
          :model-value="item.notes"
          @update:model-value="(val) => $emit('update:workDays-notes', index, typeof val === 'string' && val.length ? val : null)"
        ></BFormTextarea>
      </BFormGroup>
    </BCardText>

    <template #footer>
      <b-button @click="$emit('addRowAfter', index)">
        <font-awesome-icon :icon="['fas', 'plus']" />
      </b-button>
      <b-button v-if="computedWorkDays.length > 1" @click="$emit('removeRow', index)">
        <font-awesome-icon :icon="['fas', 'minus']" />
      </b-button>
    </template>
  </BCard>
</template>

<script setup lang="ts">
import { BButton, BCard, BCardText, BFormGroup, BFormInput, BInputGroup, BFormTextarea } from 'bootstrap-vue-next'
import type { PropType } from 'vue'
import { type ComputedWorkEntries, currentTime } from '@/ComputeWorkTime'

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
