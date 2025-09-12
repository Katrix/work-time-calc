<template>
  <BDropdown
    no-caret
    auto-close="outside"
    style="
      /*TODO: Fix this*/
      --bs-btn-padding-x: 0.25rem;
      --bs-btn-padding-y: 0rem;
      --bs-btn-font-size: 0.8rem;
      --bs-btn-border-radius: 0.3rem;
    "
  >
    <template #button-content>
      <FontAwesomeIcon :icon="['fas', 'plus']" />
    </template>
    <BDropdownItemButton
      v-for="(color, tag) in defaultSettingsStore.tagColors"
      :key="tag"
      @click="$emit('newTag', tag)"
    >
      {{ tag }}
    </BDropdownItemButton>
    <BDropdownDivider />
    <BDropdownForm>
      <BFormGroup label="New tag:" label-for="newTag">
        <BFormInput id="newTag" v-model="newTag" type="text" @keydown.prevent.enter="$emit('newTag', newTag)" />
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
import { ref } from 'vue'
import { useSettingsStore } from '@/settingsStore.ts'

const defaultSettingsStore = useSettingsStore('default', 'tasks')

defineEmits<{
  newTag: [string]
}>()

const newTag = ref('')
</script>
