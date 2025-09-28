<template>
  <fieldset>
    <legend>Github</legend>

    <div class="row" v-if="loggedIn && repoNamesStatus === 'success'">
      <BFormGroup class="col-xl-4" label-for="githubRepoOwners">
        <template #label>
          <span class="d-flex justify-content-between">
            Owners:
            <BButton variant="danger" size="sm" @click="setAllReposInactive()">Clear all</BButton>
          </span>
        </template>

        <BFormSelect id="githubRepoOwners" v-model="activeOwnerStrs" :options="ownersOptions" multiple @change="markGithubUpdate"></BFormSelect>
      </BFormGroup>

      <div class="col-xl-8">
        <BFormGroup v-if="activeOwners.length !== 0" label="Repositories:" label-for="githubRepositories">
          <BFormSelect
            id="githubRepositories"
            @change="addRepo"
            v-model="currentRepo"
            :options="repoOptions"
            :style="{
              borderBottomLeftRadius: activeOwners.length !== 0 ? 0 : undefined,
              borderBottomRightRadius: activeOwners.length !== 0 ? 0 : undefined,
              borderBottom: activeOwners.length !== 0 ? 0 : undefined,
            }"
          ></BFormSelect>
        </BFormGroup>

        <ul class="list-group">
          <li
            v-for="([ownerName, owner], idx) in activeOwners"
            :key="ownerName"
            class="list-group-item"
            :style="{ borderTopLeftRadius: idx === 0 ? 0 : undefined, borderTopRightRadius: idx === 0 ? 0 : undefined }"
          >
            <div class="d-flex justify-content-between">
              <span>{{ ownerName }}/</span>
              <BFormCheckbox v-model="owner.autocompleteWithoutOwner" class="me-4" reverse>
                Autocomplete without owner:
              </BFormCheckbox>
            </div>
            <ul class="list-group list-group-flush">
              <li v-for="[repoName, repo] in owner.repos" :key="ownerName + repoName" class="list-group-item">
                <div style="grid-template-columns: 1fr 2fr auto" class="d-grid align-items-center">
                  <span class="me-4">{{ repoName }}</span>
                  <BFormCheckbox v-model="repo.autocompleteWithoutRepository" class="me-4" reverse @change="markGithubUpdate">
                    Autocomplete without repository:
                  </BFormCheckbox>
                  <BButton variant="danger" size="sm" @click="removeRepo(ownerName, repoName)">
                    <FontAwesomeIcon :icon="['fas', 'times']" />
                  </BButton>
                </div>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
    <div v-else-if="loggedIn && repoNamesStatus === 'pending'" class="d-flex justify-content-center align-items-center">
      <FontAwesomeIcon :icon="['fa', 'spinner']" spin size="8x"></FontAwesomeIcon>
    </div>
    <BAlert v-else-if="repoNamesStatus === 'error'" variant="danger" :model-value="true">
      {{ repoNameError }}
    </BAlert>
    <BAlert v-else-if="!loggedIn" variant="info" :model-value="true">
      Not logged in. Log in to autocomplete issues in task names.
    </BAlert>
  </fieldset>
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'

const { loggedIn } = useUserSession()
const presetStore = usePresetStore()

const {
  data: repoNamesData,
  status: repoNamesStatus,
  error: repoNameError,
} = useQuery({
  queryKey: ['api', 'github', 'getRepositoryNames'],
  queryFn: ({ signal }) => $fetch('/api/github/getRepositoryNames', { signal }),
  enabled: computed(() => import.meta.client && loggedIn.value),
  retry: computed(() => false),
})

const ownersOptions = computed(() => [...new Set((repoNamesData.value ?? []).map((repo) => repo.owner.login))])

const repoOptions = computed(() => {
  const github = presetStore.currentPreset.github
  return [
    { value: null, text: 'Add a repository' },
    ...[...github.entries()].map(([ownerName, owner]) => {
      const repos = (repoNamesData.value ?? []).filter(
        (repo) => repo.owner.login === ownerName && !owner.repos.has(repo.name),
      )
      return {
        label: ownerName,
        options: repos.map((repo) => ({ text: repo.name, value: repo })),
      }
    }),
  ]
})
const currentRepo = ref<GithubRepoInfo | null>(null)
const activeOwners = computed(() => {
  return [...presetStore.currentPreset.github.entries()].filter(([, e]) => e.active)
})

const activeOwnerStrs = computed({
  get: () => activeOwners.value.map(([ownerName]) => ownerName),
  set(v) {
    const owners = presetStore.currentPreset.github
    owners.forEach((owner, ownerName) => {
      owner.active = v.includes(ownerName)
    })

    v.forEach((ownerName) => {
      if (!owners.has(ownerName)) {
        owners.set(ownerName, {
          active: true,
          autocompleteWithoutOwner: false,
          repos: new Map(),
        })
      }
    })
  },
})

function addRepo() {
  if (currentRepo.value === null) {
    return
  }
  const owners = presetStore.currentPreset.github

  const repo = currentRepo.value

  let owner = owners.get(repo.owner.login)
  if (!owner) {
    owner = {
      active: true,
      autocompleteWithoutOwner: false,
      repos: new Map(),
    }
    owners.set(repo.owner.login, owner)
  }

  owner.repos.set(repo.name, {
    autocompleteWithoutRepository: false,
  })
  nextTick(() => (currentRepo.value = null))
  markGithubUpdate()
}

function removeRepo(owner: string, repoName: string) {
  const githubOwner = presetStore.currentPreset.github.get(owner)
  if (!githubOwner) {
    return
  }

  githubOwner.repos.delete(repoName)
  markGithubUpdate()
}

function setAllReposInactive() {
  presetStore.currentPreset.github.forEach((owner) => {
    owner.active = false
  })
  markGithubUpdate()
}

function markGithubUpdate() {
  presetStore.markUpdate(presetStore.currentPresetId, 'github')
}
</script>
