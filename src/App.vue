<template>
  <BContainer fluid="xl" class="wider-container">
    <h1>Work time calc</h1>

    <BTabs v-model="active">
      <template v-for="(id, idx) in calcs">
        <BTab>
          <template #title>
            {{ calcName(idx, id) }}
            <BButton v-if="calcsLength > 1" variant="danger" size="sm" @click="removeCalc(idx)">
              <font-awesome-icon :icon="['fas', 'times']"></font-awesome-icon>
            </BButton>
          </template>

          <WorkCalc ref="calcObs" class="mt-2"></WorkCalc>
        </BTab>
      </template>

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

const calcs = ref<string[]>(["0"])
const nextId = ref(1)
const calcObs = ref<InstanceType<typeof WorkCalc>[] | null>(null)
const active = ref(0)

const calcsLength = computed(() => Object.entries(calcs.value).length)

function addCalc() {
  const id = nextId.value++
  calcs.value.push(String(id))
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
