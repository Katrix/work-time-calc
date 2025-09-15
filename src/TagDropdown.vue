<template>
  <BDropdown style="display: inline; margin-left: 0.2rem" no-caret auto-close="outside" size="sm" ref="dropdown">
    <template #button-content>
      <FontAwesomeIcon :icon="['fas', 'plus']" />
    </template>
    <BDropdownItemButton v-for="tag in applicableTags" :key="tag" @click="onSelectedTag(tag)">
      <TagBadge :tag="tag" :store-id="storeId" :hide-delete="true" />
    </BDropdownItemButton>
    <BDropdownDivider v-show="applicableTags.length > 0" />
    <BDropdownForm>
      <BFormGroup label="New tag:" label-visually-hidden label-for="newTag">
        <BFormInput id="newTag" v-model="newTag" type="text" placeholder="New tag" @keydown.prevent.enter="onNewTag" />
      </BFormGroup>
    </BDropdownForm>
  </BDropdown>
</template>

<script setup lang="ts">
import {
  BDropdown,
  BDropdownDivider,
  BDropdownForm,
  BDropdownItemButton,
  BFormGroup,
  BFormInput,
} from 'bootstrap-vue-next'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { computed, ref, useTemplateRef } from 'vue'
import { useSettingsStore } from '@/settingsStore.ts'
import TagBadge from '@/TagBadge.vue'

const props = defineProps<{
  storeId: string
  existingTags: string[]
}>()

const settingsStore = computed(() => useSettingsStore(props.storeId))

const emits = defineEmits<{
  newTag: [string]
}>()

const newTag = ref('')

const applicableTags = computed(() =>
  Object.keys(settingsStore.value.tagColors).filter((t) => !props.existingTags.includes(t)),
)

const dropdown = useTemplateRef('dropdown')

function onSelectedTag(tag: string) {
  emits('newTag', tag)
  dropdown.value?.toggle()
}

function onNewTag() {
  if (newTag.value !== '') {
    emits('newTag', newTag.value)
  }
  newTag.value = ''
  dropdown.value?.toggle()
}
</script>
