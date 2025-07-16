<template>
  <BContainer fluid="xl" class="wider-container">
    <h1>Work time calc</h1>

    <BTabs v-model:index="active">
      <BTab v-for="(id, idx) in calcs" :key="id">
        <template #title>
          {{ calcName(idx, id) }}
          <BButton v-if="calcsLength > 1" variant="danger" size="sm" @click.stop="removeCalc(idx)">
            <font-awesome-icon :icon="['fas', 'times']"></font-awesome-icon>
          </BButton>
        </template>

        <WorkCalc ref="calcObs" class="mt-2"></WorkCalc>
      </BTab>

      <BTab title="Defaults">
        <div class="row">
          <div class="col-6">
            <h2>Hours</h2>
            <DefaultSettings mode="hours" />
          </div>
          <div class="col-6">
            <h2>Tasks</h2>
            <DefaultSettings mode="tasks" />
          </div>
        </div>
      </BTab>

      <template #tabs-end>
        <BNavItem role="presentation" href="#" @click.prevent="addCalc()">
          <b>+</b>
        </BNavItem>
      </template>
    </BTabs>
  </BContainer>
</template>

<script setup lang="ts">
import { BContainer, BTabs, BTab, BButton, BNavItem } from 'bootstrap-vue-next'
import { computed, ref } from 'vue'
import WorkCalc from '@/WorkCalc.vue'
import DefaultSettings from '@/DefaultSettings.vue'

const calcs = ref<string[]>(['0'])
const nextId = ref(1)
const calcObs = ref<InstanceType<typeof WorkCalc>[] | null>(null)
const active = ref(0)

const calcsLength = computed(() => Object.entries(calcs.value).length)

function addCalc() {
  const id = nextId.value++
  calcs.value.push(String(id))
  setTimeout(() => {
    active.value = calcs.value.length - 1
  }, 50)
}

function removeCalc(idx: number) {
  if (active.value === idx && idx > 0) {
    active.value--
  }
  calcs.value.splice(idx, 1)
}

function calcName(idx: number, id: string) {
  const objs = calcObs.value ?? []
  const name = objs[idx]?.name
  return name && name.length ? name : `Calc${id}`
}
</script>
