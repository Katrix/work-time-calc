import { graphql } from '~~/server/gql/github'
import { type AnyVariables, Client, fetchExchange, type OperationResult } from '@urql/core'
import type { GithubRepoInfo } from '#shared/types/github'
import { type PageInfo } from '~~/server/gql/github/graphql'

const query = graphql(`
  query GetRepositories($pageSize: Int = 100, $after: String) {
    viewer {
      repositories(
        first: $pageSize
        after: $after
        hasIssuesEnabled: true
        orderBy: { field: NAME, direction: ASC }
        affiliations: [OWNER, ORGANIZATION_MEMBER, COLLABORATOR]
        ownerAffiliations: [OWNER, ORGANIZATION_MEMBER, COLLABORATOR]
      ) {
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

async function queryPaginated<QueryRes, Variables extends AnyVariables>(
  doQuery: (after: string | null | undefined) => Promise<OperationResult<QueryRes, Variables>>,
  getPageInfo: (data: QueryRes) => Pick<PageInfo, 'hasNextPage' | 'endCursor'>,
): Promise<QueryRes[]> {
  let after: string | null | undefined = null
  let hasNextPage = true

  let results: QueryRes[] = []
  do {
    const res = await doQuery(after)
    if (!res.data) {
      console.log('GraphQL error', res.error?.message, res.error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch repositories. Error: ' + (res.error?.message ?? 'Unknown error'),
      })
    }

    results.push(res.data)

    const pageInfo = getPageInfo(res.data)

    hasNextPage = pageInfo.hasNextPage
    after = pageInfo.endCursor
  } while (hasNextPage)

  return results
}

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

  const rawResults = await queryPaginated(
    (after) => client.query(query, { pageSize: 100, after }).toPromise(),
    (data) => data.viewer.repositories.pageInfo,
  )

  const result: GithubRepoInfo[] = rawResults
    .map((r) => r.viewer.repositories.nodes ?? [])
    .flat()
    .flatMap((n) => (n !== null ? [n] : []))

  return result
})
