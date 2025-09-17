<template>
  <div class="card" v-if="hasTagSummary">
    <div class="card-header">Summary</div>

    <ul class="list-group list-group-flush">
      <li class="list-group-item" v-for="(summary, tag) in tagSummaries" :key="tag">
        <TagBadge :tag="tag" :store-id="storeId" :hide-delete="true" />
        Worked time: {{ summary.time }} Entries: {{ summary.names.join(', ') }} Notes: {{ summary.notes.join(', ') }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ storeId: string; tagSummaries: Record<string, TagSummary> }>()
const hasTagSummary = computed(() => Object.entries(props.tagSummaries).length > 0)
</script>

