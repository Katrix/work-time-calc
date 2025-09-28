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

export default defineCachedEventHandler(
  async (event) => {
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
  },
  {
    maxAge: 60 * 60 * 4,
    getKey: async (event) => {
      const session = await getUserSession(event)
      const accessToken = session.secure?.githubAccessToken
      if (!accessToken) {
        return `${event.method}:${event.path}`
      }
      return `${event.method}:${event.path}:${accessToken}`
    },
  },
)
