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

const autocompleteOptions = computed(() => {
  const reposByOwner = presetStore.currentPreset.github.repos
  return (
    currentIssues.value?.map((issue) => {
      const repos = reposByOwner.get(issue.repositoryOwner)
      const repo = repos?.find((repo) => repo.name === issue.repository)
      const justIssueReference = `${issue.repository}/#${issue.number}`
      const partial = `${justIssueReference} (${issue.title})`
      return {
        text: repo?.autocompleteWithoutOwner ? `${issue.repositoryOwner}/${partial}` : partial,
        value: justIssueReference,
      }
    }) ?? []
  )
})

const emits = defineEmits<{
  (e: 'onAutocompleteIssue', notes: string): void
}>()

const debouncedName = debouncedRef(name, 500)
const { data: currentIssues } = useQuery({
  queryKey: [debouncedName, computed(() => presetStore.currentPreset.github.repos)],
  queryFn: ({ signal }) =>
    $fetch(`/api/github/autocompleteIssue`, {
      query: {
        prefix: debouncedName.value,
        repo: [...presetStore.currentPreset.github.repos.entries()].flatMap(([owner, repos]) =>
          repos.map((repo) => `${owner}/${repo.name}`),
        ),
      },
      retry: false,
      signal,
    }),
  enabled: computed(
    () =>
      import.meta.client &&
      isVisible.value &&
      auth.loggedIn &&
      props.mode === 'tasks' &&
      debouncedName.value.length > 0,
  ),
  staleTime: 1000 * 60 * 5,
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
    name.value = autocompleteOptions.value[idx].value
    const issue = currentIssues.value?.find(
      (i) => `${i.repository}/#${i.number}` === name.value || `${i.repositoryOwner}/${i.repository}/#${i.number}`,
    )
    if (issue) {
      emits('onAutocompleteIssue', issue.title)
    }
    dropdownVisible.value = false
    selectedDropdown.value = null
  }
}
</script>
