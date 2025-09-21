import z from 'zod'
import { getToken } from '#auth'
import { graphql } from '~~/server/utils/gql'
import { Client, fetchExchange } from '@urql/core'

const query = graphql(`
  query AutocompleteIssues($query: String!, $first: Int) {
    search(type: ISSUE, query: $query, first: $first) {
      nodes {
        ... on Issue {
          title
          number
          repository {
            name
            nameWithOwner
          }
        }
      }
    }
  }
`)

export default defineEventHandler(async (event) => {
  const { prefix, repo: reposToSearch } = await getValidatedQuery(
    event,
    z.object({ prefix: z.string(), repo: z.string().array() }).parse,
  )

  const token = await getToken({ event })
  const sessionToken = token?.sessionToken
  if (!token || !token.sessionToken) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = new Client({
    url: 'https://api.github.com/graphql',
    fetchOptions: {
      headers: {
        authorization: `Bearer ${sessionToken}`,
      },
    },
    exchanges: [fetchExchange],
  })

  if (reposToSearch.length === 0) {
    return []
  }
  const repoFilters = reposToSearch.map((repo) => `repo:${repo}`).join(' OR ')

  // TODO: Use RegExp.escape() when it's available

  const searchQuery = `is:issue /^${prefix.replace('\\', '\\\\')}/ in:title (${repoFilters})`
  const res = await client.query(query, { query: searchQuery, first: 20 }).toPromise()

  if (!res.data) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch issues' })
  }

  const nodes = res.data.search.nodes
  if (!nodes) {
    return []
  }

  return nodes
    .flatMap((n) => (n?.__typename === 'Issue' ? [n] : []))
    .map((n) => ({
      title: n.title,
      number: n.number,
      repositoryWithOwner: n.repository.nameWithOwner,
      repository: n.repository.name,
    }))
})
