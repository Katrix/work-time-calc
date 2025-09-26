<template>
  <fieldset>
    <label v-if="mode === 'hours'" for="workTimeInput">Work time:</label>
    <div v-if="mode === 'hours'">
      <BFormInput id="workTimeInput" v-model="presetStore.currentPreset[mode].workTime"></BFormInput>
    </div>

    <label v-if="mode === 'hours'" for="defaultWorkFromInput">Default work from:</label>
    <div v-if="mode === 'hours'">
      <BFormInput id="defaultWorkFromInput" v-model="presetStore.currentPreset[mode].defaultFrom"></BFormInput>
    </div>

    <label v-if="mode === 'hours'" for="defaultWorkToInput">Default work to:</label>
    <div v-if="mode === 'hours'">
      <BFormInput id="defaultWorkToInput" v-model="presetStore.currentPreset[mode].defaultTo"></BFormInput>
    </div>

    <label for="precisionInput">Precision (minutes)</label>
    <div>
      <BFormInput id="precisionInput" v-model="presetStore.currentPreset[mode].precision" type="number" />
    </div>
  </fieldset>

  <hr />

  <fieldset v-if="mode === 'hours'">
    <legend>Holidays</legend>

    <BFormCheckboxGroup stacked v-model="checkedHolidays" :options="namedOptions" name="holidays" />

    <hr />

    <fieldset>
      <legend>Custom days</legend>

      <SettingsFixedHolidayInput
        v-for="{ rule, idx } in fixedRulesWithIdx"
        :key="idx"
        v-model:from="rule.from"
        v-model:to="rule.to"
        @add-after="addFixedRuleAfter(idx)"
        @remove="removeRule(idx)"
      />

      <div v-if="presetStore.currentPreset[mode].holidayRules.filter((rule) => rule.type === 'fixed').length === 0">
        <button
          type="button"
          class="btn btn-secondary btn-sm"
          @click="addFixedRuleAfter(presetStore.currentPreset['hours'].holidayRules.length - 1)"
        >
          <FontAwesomeIcon :icon="['fas', 'plus']" />
        </button>
      </div>
    </fieldset>
  </fieldset>

  <SettingsGithub v-if="mode === 'tasks'" />
</template>

<script setup lang="ts">
import { Temporal } from '@js-temporal/polyfill'

defineProps<{ mode: 'hours' | 'tasks' }>()
const presetStore = usePresetStore()

type HolidayRuleType = HolidayRule['type']
type NamedHolidayRuleType = Exclude<HolidayRuleType, 'fixed'>

const checkedHolidays = computed<NamedHolidayRuleType[], NamedHolidayRuleType[]>({
  get() {
    return presetStore.currentPreset['hours'].holidayRules.map((rule) => rule.type).filter((type) => type !== 'fixed')
  },
  set(value) {
    const fixedRules = presetStore.currentPreset['hours'].holidayRules.filter((rule) => rule.type === 'fixed')
    const namedRules: HolidayRule[] = value.map((type) => ({ type }))

    presetStore.currentPreset['hours'].holidayRules = [...namedRules, ...fixedRules]
  },
})

const namedOptions: { text: string; value: NamedHolidayRuleType }[] = [
  { text: 'Easter', value: 'easter' },
  { text: 'Ascension day', value: 'ascension' },
  { text: 'Pentecost', value: 'pentecost' },
  { text: 'Christmas', value: 'christmas' },
  { text: 'Saturday', value: 'saturday' },
  { text: 'Sunday', value: 'sunday' },
]

const fixedRulesWithIdx = computed<{ rule: FixedHolidayRule; idx: number }[]>(() => {
  const fixedRules: { rule: FixedHolidayRule; idx: number }[] = []
  const rules = presetStore.currentPreset['hours'].holidayRules
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]
    if (rule.type === 'fixed') {
      fixedRules.push({ rule, idx: i })
    }
  }

  return fixedRules
})

function addFixedRuleAfter(index: number) {
  const rule: FixedHolidayRule = {
    type: 'fixed',
    from: Temporal.PlainMonthDay.from({ month: 1, day: 1 }),
    to: Temporal.PlainMonthDay.from({ month: 1, day: 1 }),
  }
  presetStore.currentPreset['hours'].holidayRules.splice(index + 1, 0, rule)
}

function removeRule(index: number) {
  presetStore.currentPreset['hours'].holidayRules.splice(index, 1)
}
</script>
