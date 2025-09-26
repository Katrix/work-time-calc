<template>
  <fieldset>
    <legend>Github</legend>

    <div class="row" v-if="auth.status.value === 'authenticated' && repoNamesStatus === 'success'">
      <BFormGroup class="col-xl-4" label-for="githubRepoOwners">
        <template #label>
          <span class="d-flex justify-content-between">
            Owners:
            <BButton variant="danger" size="sm" @click="presetStore.currentPreset.github.owners = []"
              >Clear all</BButton
            >
          </span>
        </template>

        <BFormSelect
          id="githubRepoOwners"
          v-model="presetStore.currentPreset.github.owners"
          :options="ownersOptions"
          multiple
        ></BFormSelect>
      </BFormGroup>

      <div class="col-xl-8">
        <BFormGroup
          v-if="presetStore.currentPreset.github.owners.length !== 0"
          label="Repositories:"
          label-for="githubRepositories"
        >
          <BFormSelect
            id="githubRepositories"
            @change="addRepo"
            v-model="currentRepo"
            :options="repoOptions"
            :style="{
              borderBottomLeftRadius: activeRepos.length !== 0 ? 0 : undefined,
              borderBottomRightRadius: activeRepos.length !== 0 ? 0 : undefined,
              borderBottom: activeRepos.length !== 0 ? 0 : undefined,
            }"
          ></BFormSelect>
        </BFormGroup>
        |

        <ul class="list-group">
          <li
            v-for="([owner, repoArr], idx) in activeRepos"
            :key="owner"
            class="list-group-item"
            :style="{ borderTopLeftRadius: idx === 0 ? 0 : undefined, borderTopRightRadius: idx === 0 ? 0 : undefined }"
          >
            <span>{{ owner }}/</span>
            <ul class="list-group list-group-flush">
              <li v-for="repo in repoArr" :key="owner + repo.name" class="list-group-item">
                <div class="d-flex flex-row align-items-center flex-wrap">
                  <span class="me-4">{{ repo.name }} ({{ repo.nameWithOwner }})</span>
                  <BFormCheckbox v-model="repo.autocompleteWithoutOwner" class="me-4" reverse>
                    Autocomplete without owner:
                  </BFormCheckbox>
                  <BButton variant="danger" size="sm" @click="removeRepo(owner, repo)">
                    <FontAwesomeIcon :icon="['fas', 'times']" />
                  </BButton>
                </div>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
    <div
      v-else-if="auth.status.value === 'loading' || repoNamesStatus === 'pending'"
      class="d-flex justify-content-center align-items-center"
    >
      <FontAwesomeIcon :icon="['fa', 'spinner']" spin size="8x"></FontAwesomeIcon>
    </div>
    <BAlert v-else-if="repoNamesStatus === 'error'" variant="danger" :model-value="true">
      {{ repoNameError }}
    </BAlert>
    <BAlert v-else-if="auth.status.value === 'unauthenticated'" variant="info" :model-value="true">
      Not logged in. Log in to autocomplete issues in task names.
    </BAlert>
  </fieldset>
</template>

<script setup lang="ts">
const auth = useAuth()
const presetStore = usePresetStore()

interface Repo {
  name: string
  nameWithOwner: string
  autocompleteWithoutOwner: boolean
}

const {
  data: repoNamesData,
  status: repoNamesStatus,
  error: repoNameError,
  refresh: repoNamesRefresh,
} = await useFetch('/api/github/getRepositoryNames', {
  immediate: false,
})

watch(
  computed(() => auth.status.value),
  (status) => {
    if (status === 'authenticated') {
      repoNamesRefresh()
    }
  },
  {
    immediate: true,
  },
)

const ownersOptions = computed(() => [...new Set((repoNamesData.value ?? []).map((repo) => repo.owner.login))])

const repoOptions = computed(() => [
  { value: null, text: 'Add a repository' },
  ...presetStore.currentPreset.github.owners.map((owner) => {
    const repos = (repoNamesData.value ?? []).filter((repo) => repo.owner.login === owner)
    return {
      label: owner,
      options: repos.map((repo) => ({ text: repo.name, value: repo })),
    }
  }),
])
const currentRepo = ref<GithubRepoInfo | null>(null)
const activeRepos = computed(() => {
  const github = presetStore.currentPreset.github
  return [...github.repos.entries()].filter(([owner]) => github.owners.includes(owner))
})

function addRepo() {
  if (currentRepo.value === null) {
    return
  }
  const repos = presetStore.currentPreset.github.repos

  const repo = currentRepo.value

  let repoArr = repos.get(repo.owner.login)
  if (!repoArr) {
    repoArr = []
    repos.set(repo.owner.login, repoArr)
  }

  repoArr.push({
    name: repo.name,
    nameWithOwner: repo.nameWithOwner,
    autocompleteWithoutOwner: false,
  })
  nextTick(() => (currentRepo.value = null))
}

function removeRepo(owner: string, repo: Repo) {
  const repos = presetStore.currentPreset.github.repos
  const repoArr = repos.get(owner)
  if (!repoArr) {
    return
  }

  const idx = repoArr.indexOf(repo)
  if (idx === -1) {
    return
  }
  repoArr.splice(idx, 1)
  if (repoArr.length === 0) {
    repos.delete(owner)
  }
}
</script>
