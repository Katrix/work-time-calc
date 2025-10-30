<template>
  <BFormInput v-if="mode === 'hours'" v-model="name"></BFormInput>
  <div v-else style="position: relative">
    <BFormInput
      ref="entryName"
      id="entryName"
      tabindex="2"
      :style="{
        borderBottomLeftRadius: dropdownVisible && autocompleteOptions.length > 0 ? 0 : undefined,
        borderBottomRightRadius: dropdownVisible && autocompleteOptions.length > 0 ? 0 : undefined,
        borderBottom: dropdownVisible && autocompleteOptions.length > 0 ? 0 : undefined,
      }"
      v-model="name"
      @change="hasEdited = true"
      @focus="onFocus"
      @blur="onBlur"
      @keydown.up="setFocused(-1)"
      @keydown.down="setFocused(1)"
      @keydown.enter="onSelectAutocomplete(selectedDropdown)"
    />
    <ul
      v-if="dropdownVisible"
      class="list-group"
      ref="listElem"
      role="listbox"
      :aria-activedescendant="
        selectedDropdown !== null && searchOptionElems !== null && searchOptionElems
          ? searchOptionElems[selectedDropdown].id
          : undefined
      "
      tabindex="2"
      style="position: absolute; top: 100%; z-index: 99; left: 0; right: 0"
      @focus="
        () => {
          onFocus()
          setFocused(1)
        }
      "
      @blur="onBlur"
      @keydown.up="setFocused(-1)"
      @keydown.down="setFocused(1)"
      @keydown.enter="onSelectAutocomplete(selectedDropdown)"
    >
      <CalcInputSearchOption
        v-for="(item, idx) in autocompleteOptions"
        ref="searchOptionElem"
        :tabindex="3 + idx"
        :key="idx"
        :selected="idx === selectedDropdown"
        :is-first="idx === 0"
        :text="item.text"
        @focus="selectedDropdown = idx"
        @blur="onBlur"
        @selected="onSelectAutocomplete(idx)"
      />
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import CalcInputSearchOption from '~/components/calc/input/CalcInputSearchOption.vue'

const presetStore = usePresetStore()
const auth = useUserSession()
const props = defineProps<{ mode: 'hours' | 'tasks' }>()

const formInput = useTemplateRef<HTMLInputElement>('entryName')
const listElem = useTemplateRef<HTMLUListElement>('listElem')
const searchOptionElems = useTemplateRef<InstanceType<typeof CalcInputSearchOption>[]>('searchOptionElem')

const isVisible = ref(false)
useIntersectionObserver(formInput, ([entry]) => {
  isVisible.value = entry?.isIntersecting ?? false
})

const dropdownVisible = ref(false)
const selectedDropdown = ref<number | null>(null)

const name = defineModel<string>({ required: true })
const hasEdited = ref(false)

const autocompleteOptions = computed(() => {
  return (
    currentIssues.value?.map((issue) => {
      const githubOwner = presetStore.currentPreset.github.get(issue.repositoryOwner)
      const repo = githubOwner?.repos?.get(issue.repository)

      const issueNumber = `#${issue.number}`
      const issueReference =
        githubOwner?.autocompleteWithoutOwner && repo?.autocompleteWithoutRepository
          ? issueNumber
          : `${issue.repository}/${issueNumber}`
      const issueReferenceWithOwner = githubOwner?.autocompleteWithoutOwner
        ? issueReference
        : `${issue.repositoryOwner}/${issueReference}`

      return {
        text: `${issueReferenceWithOwner} (${issue.title})`,
        value: issueReferenceWithOwner,
        title: issue.title,
      }
    }) ?? []
  )
})

const emits = defineEmits<{
  (e: 'onAutocompleteIssue', notes: string): void
}>()

const debouncedName = debouncedRef(name, 500)
const { data: currentIssues } = useQuery({
  queryKey: ['api', 'github', 'autocompleteIssue', debouncedName, computed(() => presetStore.currentPreset.github)],
  queryFn: ({ signal }) =>
    $fetch(`/api/github/autocompleteIssue`, {
      query: {
        prefix: debouncedName.value,
        repo: [...presetStore.currentPreset.github.entries()]
          .filter(([, e]) => e.active)
          .flatMap(([ownerStr, owner]) => [...owner.repos.keys()].map((repo) => `${ownerStr}/${repo}`)),
      },
      retry: false,
      signal,
    }),
  enabled: computed(
    () =>
      import.meta.client &&
      isVisible.value &&
      auth.loggedIn &&
      hasEdited.value &&
      props.mode === 'tasks' &&
      debouncedName.value.length > 0,
  ),
  staleTime: 1000 * 60 * 5,
  retry: computed(() => false),
})

function onFocus() {
  const previouslyVisible = dropdownVisible.value
  if (!previouslyVisible) {
    dropdownVisible.value = true
    selectedDropdown.value = null
  }
}

function onBlur() {
  setTimeout(() => {
    if (
      document.activeElement !== formInput.value &&
      document.activeElement !== listElem.value &&
      searchOptionElems.value?.every((elem) => document.activeElement !== elem.$el)
    ) {
      dropdownVisible.value = false
      selectedDropdown.value = null
    }
  }, 200)
}

function setFocused(change: number) {
  if (selectedDropdown.value === null && change === 1) {
    selectedDropdown.value = 0
    return
  }

  let newValue = (selectedDropdown.value ?? 0) + change
  if (newValue >= autocompleteOptions.value.length) {
    newValue -= autocompleteOptions.value.length
  }
  if (newValue < 0) {
    newValue += autocompleteOptions.value.length
  }
  selectedDropdown.value = newValue
  if (searchOptionElems.value) {
    searchOptionElems.value[selectedDropdown.value].$el.focus()
  }
}

function onSelectAutocomplete(idx: number | null) {
  if (idx !== null) {
    const selected = autocompleteOptions.value[idx]
    hasEdited.value = false
    name.value = selected.value
    emits('onAutocompleteIssue', selected.title)

    dropdownVisible.value = false
    selectedDropdown.value = null
  }
}
</script>
