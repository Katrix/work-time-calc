import { getToken } from '#auth'
import { graphql } from '~~/server/utils/gql'
import { Client, fetchExchange } from '@urql/core'
import { defineCachedEventHandler } from 'nitropack/runtime/internal/cache'

const query = graphql(`
  query GetRepositories($pageSize: Int = 100, $after: String) {
    viewer {
      repositories(first: $pageSize, after: $after, hasIssuesEnabled: true, orderBy: { field: NAME, direction: ASC }) {
        pageInfo {
          endCursor
          hasNextPage
        }
        nodes {
          id
          name
          nameWithOwner
          url
        }
      }
    }
  }
`)

export interface RepoInfo {
  id: string
  name: string
  nameWithOwner: string
  url: string
}

export default defineCachedEventHandler(
  async (event) => {
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

    let after = null
    let hasNextPage = true
    const result: RepoInfo[] = []
    do {
      const res = await client.query(query, { pageSize: 100, after }).toPromise()
      if (!res.data) {
        throw createError({ statusCode: 500, statusMessage: 'Failed to fetch repositories' })
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
      const token = await getToken({ event })
      const sessionToken = token?.sessionToken
      if (!token || !token.sessionToken) {
        return `${event.method}:${event.path}`
      }
      return `${event.method}:${event.path}:${sessionToken}`
    },
  },
)
