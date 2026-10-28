<template>
  <div v-for="(item, index) in calcInfo.calc.entries" :key="item.name + index" class="card mb-4">
    <div class="card-header">
      <CalcInputName
        v-model="item.name"
        :mode="calcInfo.calc.mode"
        @on-autocomplete-issue="(notes) => (item.notes = notes)"
      />
    </div>

    <div class="card-body">
      <div class="card-text">
        <BFormGroup label="Arrived:">
          <CalcInputFrom :precision="calcInfo.calc.precision" v-model="item.from" />
        </BFormGroup>

        <BFormGroup label="Left:" class="mb-2">
          <CalcInputTo
            :precision="calcInfo.calc.precision"
            v-model:to="item.to"
            v-model:is-tracking="item.isTracking"
          />
        </BFormGroup>

        <!-- FIXME: This causes a hydration error if it's not client only -->
        <ClientOnly>
          <dl class="row" v-if="calcInfo.computedCalc?.entries?.[index]">
            <dt class="col-5">Worked time:</dt>
            <dd class="col-7">{{ calcInfo.computedCalc.entries[index].workedTime }}</dd>
            <dt class="col-5">Extra time:</dt>
            <dd class="col-7">{{ calcInfo.computedCalc.entries[index].extraTime }}</dd>
          </dl>
        </ClientOnly>

        <BFormGroup v-if="calcInfo.calc.mode !== 'tasks'" label="Subtracted time:">
          <CalcInputSubtractedTime v-model="item.subtractedTime" />
        </BFormGroup>

        <BFormGroup label="Notes:">
          <!-- FIXME: This fails on page reload in dev mode if it's not Lazy and I'm checking responsive dev mode -->
          <LazyBFormTextarea v-model="item.notes" />
        </BFormGroup>

        <template v-if="calcInfo.calc.mode === 'tasks'">
          Tags:
          <TagBadge
            v-for="tag in item.tags ?? []"
            :key="tag"
            :tag="tag"
            :calc-info="calcInfo"
            @delete-tag="calcInfo.removeTag(index, tag)"
          />
          <TagDropdown
            :calc-info="calcInfo"
            :existing-tags="item.tags ?? []"
            @new-tag="(tag) => calcInfo.addTag(index, tag)"
          />
        </template>
      </div>
    </div>

    <div class="card-footer">
      <button class="btn btn-secondary" @click="calcInfo.addRowAfter(index)">
        <FontAwesomeIcon :icon="['fas', 'plus']" />
      </button>
      <button class="btn btn-secondary" v-if="calcInfo.calc.entries.length > 1" @click="calcInfo.removeRow(index)">
        <FontAwesomeIcon :icon="['fas', 'minus']" />
      </button>
    </div>
  </div>

  <CalcTagSummary :calc-info="calcInfo" :tag-summaries="calcInfo.computedCalc?.summaryByTag ?? {}" />
</template>

<script setup lang="ts">
defineProps<{ calcInfo: CalcInfo }>()
</script>
