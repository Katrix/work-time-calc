import z from 'zod'
import { graphql } from '~~/server/utils/gql'
import { Client, fetchExchange } from '@urql/core'

const query = graphql(`
  query AutocompleteIssues($query: String!, $first: Int) {
    search(type: ISSUE, query: $query, first: $first) {
      nodes {
        ... on Issue {
          __typename
          title
          number
          repository {
            name
            owner {
              login
            }
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

  const session = await getUserSession(event)
  const accessToken = session.secure?.githubAccessToken
  if (!accessToken) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = new Client({
    url: 'https://api.github.com/graphql',
    fetchOptions: {
      headers: {
        authorization: `Bearer ${accessToken}`,
        'user-agent': 'Work-time-calc',
      },
    },
    preferGetMethod: false,
    exchanges: [fetchExchange],
  })

  if (reposToSearch.length === 0) {
    return []
  }
  const repoFilters = reposToSearch.map((repo) => `repo:${repo}`).join(' ')

  // TODO: Use RegExp.escape() when it's available

  const searchQuery = `is:issue state:open /^${prefix.replace('\\', '\\\\')}/ in:title ${repoFilters}`
  console.log({ searchQuery })
  const res = await client.query(query, { query: searchQuery, first: 20 }).toPromise()

  if (!res.data) {
    console.log('GraphQL error', res.error?.message, res.error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch issues. Error: ' + (res.error?.message ?? 'Unknown error'),
    })
  }

  const nodes = res.data.search.nodes
  console.log({ nodes })
  if (!nodes) {
    return []
  }

  return nodes
    .flatMap((n) => (n?.__typename === 'Issue' ? [n] : []))
    .map((n) => ({
      title: n.title,
      number: n.number,
      repositoryOwner: n.repository.owner.login,
      repository: n.repository.name,
    }))
})
