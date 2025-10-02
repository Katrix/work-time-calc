import { graphql } from '~~/server/gql/github'
import { Client, fetchExchange } from '@urql/core'
import { defineCachedEventHandler } from 'nitropack/runtime/internal/cache'
import type { GithubRepoInfo } from '#shared/types/github'

const query = graphql(`
  query GetRepositories($pageSize: Int = 100, $after: String) {
    viewer {
      repositories(first: $pageSize, after: $after, hasIssuesEnabled: true, orderBy: { field: NAME, direction: ASC }) {
        pageInfo {
          endCursor
          hasNextPage
        }
        nodes {
          owner {
            login
          }
          name
          url
        }
      }
    }
  }
`)

export default defineEventHandler(async (event) => {
  const accessToken = await useAccessToken(event)

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

  let after: string | null | undefined = null
  let hasNextPage = true
  const result: GithubRepoInfo[] = []
  do {
    const res = await client.query(query, { pageSize: 100, after }).toPromise()
    if (!res.data) {
      console.log('GraphQL error', res.error?.message, res.error, accessToken)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch repositories. Error: ' + (res.error?.message ?? 'Unknown error'),
      })
    }

    result.push(...(res.data.viewer.repositories.nodes ?? []).flatMap((n) => (n !== null ? [n] : [])))

    hasNextPage = res.data.viewer.repositories.pageInfo.hasNextPage
    after = res.data.viewer.repositories.pageInfo.endCursor
  } while (hasNextPage)

  return result
})
