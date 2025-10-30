import z from 'zod'
import type { OctokitResponse } from '@octokit/types'
import type { Octokit } from 'octokit'

async function queryIssues(octokit: Octokit, repos: string[], prefix: string, abortSignal: AbortSignal) {
  const repoFilters = repos.map((repo) => `repo:${repo}`).join(' OR ')
  console.log(`Searching ${repos.length} repos`)

  // TODO: Use RegExp.escape() when it's available

  const searchQuery = `is:issue state:open /^${prefix.replace('\\', '\\\\')}/ in:title (${repoFilters})`

  let res: OctokitResponse<{
    total_count: number
    incomplete_results: boolean
    items: {
      title: string
      number: number
      html_url: string
    }[]
  }>
  try {
    const now = Date.now()
    res = await octokit.rest.search.issuesAndPullRequests({
      advanced_search: 'true',
      q: searchQuery,
      first: 20,
      request: {
        signal: abortSignal,
      }
    })
    console.log(`Got ${res.data.items.length} results in ${Date.now() - now}ms`)
  } catch (e) {
    console.error('Error searching GitHub:', e)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error searching GitHub',
    })
  }

  console.log(`Got ${res.data.items.length} results`)

  return res.data.items.map((n) => {
    const url = n.html_url
    const urlParts = url.split('/')
    urlParts.pop() // Issue number
    urlParts.pop() // Issues
    const repo = urlParts.pop()
    const owner = urlParts.pop()
    return {
      title: n.title,
      number: n.number,
      repositoryOwner: owner ?? '',
      repository: repo ?? '',
    }
  })
}

export default defineEventHandler(async (event) => {
  const { prefix, repo: reposToSearch } = await getValidatedQuery(
    event,
    z.object({
      prefix: z.string(),
      repo: z
        .string()
        .array()
        .or(z.string().transform((s) => [s]))
        .optional(),
    }).parse,
  )

  const octokit = await useOctokit(event)
  console.log('Created octokit')

  if (!reposToSearch || reposToSearch.length === 0) {
    return []
  }

  const resultItems: Promise<
    {
      title: string
      number: number
      repositoryOwner: string
      repository: string
    }[]
  >[] = []
  console.log(`In total searching ${reposToSearch.length} repos`)

  const abort = new AbortController()

  for (let i = 0; i < reposToSearch.length; i += 5) {
    const toSearch = reposToSearch.slice(i, i + 5)

    resultItems.push(queryIssues(octokit, toSearch, prefix, abort.signal))
  }

  setTimeout(() => {
    abort.abort('Timed out')
  }, 3000)

  const all = await Promise.all(resultItems)

  console.log()
  console.log()

  return all.flat()
})
