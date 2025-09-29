<template>
  <div v-for="(item, index) in calc.entries" :key="item.name + index" class="card mb-4">
    <div class="card-header">
      <CalcInputName v-model="item.name" :mode="calc.mode" @on-autocomplete-issue="(notes) => (item.notes = notes)" />
    </div>

    <div class="card-body">
      <div class="card-text">
        <BFormGroup label="Arrived:">
          <CalcInputFrom :precision="calc.precision" v-model="item.from" />
        </BFormGroup>

        <BFormGroup label="Left:" class="mb-2">
          <CalcInputTo :precision="calc.precision" v-model:to="item.to" v-model:is-tracking="item.isTracking" />
        </BFormGroup>

        <!-- FIXME: This causes a hydration error if it's not client only -->
        <ClientOnly>
          <dl class="row" v-if="computedCalc?.entries?.[index]">
            <dt class="col-5">Worked time:</dt>
            <dd class="col-7">{{ computedCalc.entries[index].workedTime }}</dd>
            <dt class="col-5">Extra time:</dt>
            <dd class="col-7">{{ computedCalc.entries[index].extraTime }}</dd>
          </dl>
        </ClientOnly>

        <BFormGroup v-if="calc.mode !== 'tasks'" label="Subtracted time:">
          <CalcInputSubtractedTime
            v-model:subtracted-time="item.subtractedTime"
            v-model:custom-subtracted-time="item.customSubtractedTime"
          ></CalcInputSubtractedTime>
        </BFormGroup>

        <BFormGroup label="Notes:">
          <!-- FIXME: This fails on page reload in dev mode if it's not Lazy and I'm checking responsive dev mode -->
          <LazyBFormTextarea v-model="item.notes" />
        </BFormGroup>

        <template v-if="calc.mode === 'tasks'">
          Tags:
          <TagBadge
            v-for="tag in item.tags ?? []"
            :key="tag"
            :tag="tag"
            :calc-id="calcId"
            @delete-tag="removeTag(index, tag)"
          />
          <TagDropdown :calc-id="calcId" :existing-tags="item.tags ?? []" @new-tag="(tag) => addTag(index, tag)" />
        </template>
      </div>
    </div>

    <div class="card-footer">
      <button class="btn btn-secondary" @click="addRowAfter(index)">
        <FontAwesomeIcon :icon="['fas', 'plus']" />
      </button>
      <button class="btn btn-secondary" v-if="calc.entries.length > 1" @click="removeRow(index)">
        <FontAwesomeIcon :icon="['fas', 'minus']" />
      </button>
    </div>
  </div>

  <CalcTagSummary :calcId="calcId" :tag-summaries="computedCalc?.summaryByTag ?? {}" />
</template>

<script setup lang="ts">
const props = defineProps<{ calcId: string }>()
const calcStore = useCalcStore()
const { calc, computedCalc, addTag, removeTag, addRowAfter, removeRow } = calcStore.useCalc(
  computed(() => props.calcId),
)
</script>
