<template>
  <BFormInput v-if="mode === 'hours'" v-model="name"></BFormInput>
  <template v-else>
    <BFormInput
      ref="entryName"
      id="entryName"
      list="entryNameOptions"
      v-model="name"
      @change="onInputChange"
      @input="onInputChange"
    />
    <BFormDatalist id="entryNameOptions" :options="autocompleteOptions" />
  </template>
</template>

<script setup lang="ts">
const presetStore = usePresetStore()
const auth = useUserSession()
const props = defineProps<{ mode: 'hours' | 'tasks' }>()

const formInput = useTemplateRef<HTMLElement>('entryName')
const isVisible = ref(false)
useIntersectionObserver(formInput, ([entry]) => {
  isVisible.value = entry?.isIntersecting ?? false
})

const name = defineModel<string>({ required: true })

interface AutocompleteIssue {
  title: string
  number: number
  repositoryOwner: string
  repository: string
}

const currentIssues = ref<AutocompleteIssue[]>([])
const autocompleteOptions = computed(() => {
  const reposByOwner = presetStore.currentPreset.github.repos
  return currentIssues.value.map((issue) => {
    const repos = reposByOwner.get(issue.repositoryOwner)
    const repo = repos?.find((repo) => repo.name === issue.repository)
    const justIssueReference = `${issue.repository}/#${issue.number}`
    const partial = `${justIssueReference} (${issue.title})`
    return {
      text: repo?.autocompleteWithoutOwner ? `${issue.repositoryOwner}/${partial}` : partial,
      value: justIssueReference,
    }
  })
})

const emits = defineEmits<{
  (e: 'onAutocompleteIssue', notes: string): void
}>()

const debouncedName = debouncedRef(name, 500)
const abortController = ref(new AbortController())
watchEffect(async () => {
  if (isVisible.value && auth.loggedIn && props.mode === 'tasks') {
    abortController.value.abort()
    abortController.value = new AbortController()
    const issues = await $fetch(`/api/github/autocompleteIssue`, {
      query: {
        prefix: debouncedName.value,
        repo: [...presetStore.currentPreset.github.repos.entries()].flatMap(([owner, repos]) =>
          repos.map((repo) => `${owner}/${repo.name}`),
        ),
      },
      retry: false,
      signal: abortController.value.signal,
    })

    if (issues) {
      currentIssues.value = issues
    }
  }
})

function onInputChange() {
  nextTick(() => {
    const issue = currentIssues.value.find(
      (i) => `${i.repository}/#${i.number}` === name.value || `${i.repositoryOwner}/${i.repository}/#${i.number}`,
    )
    if (issue) {
      emits('onAutocompleteIssue', issue.title)
    }
  })
}
</script>
