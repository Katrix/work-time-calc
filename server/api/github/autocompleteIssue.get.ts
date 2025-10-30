import z from 'zod'
import { Octokit } from 'octokit'

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

  const accessToken = await useAccessToken(event)
  console.log('Got access token')

  const octokit = new Octokit({ userAgent: 'Work-time-calc', auth: accessToken })

  if (!reposToSearch || reposToSearch.length === 0) {
    return []
  }
  const repoFilters = reposToSearch.map((repo) => `repo:${repo}`).join(' OR ')
  console.log(`Searching ${reposToSearch.length} repos`)

  // TODO: Use RegExp.escape() when it's available

  const searchQuery = `is:issue state:open /^${prefix.replace('\\', '\\\\')}/ in:title (${repoFilters})`

  const res = await octokit.rest.search.issuesAndPullRequests({
    advanced_search: 'true',
    q: searchQuery,
    first: 20,
  })

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
})
