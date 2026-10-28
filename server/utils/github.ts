import { type H3Event } from 'h3'
import { Octokit } from '@octokit/core'
import { createOAuthUserAuth, type GitHubAppAuthenticationWithExpiration } from '@octokit/auth-oauth-user'
import { type Api, restEndpointMethods } from '@octokit/plugin-rest-endpoint-methods'
import { type PaginateInterface, paginateRest } from '@octokit/plugin-paginate-rest'

export async function useOctokit(event: H3Event) {
  const session = await getUserSession(event)
  let accessToken = session.secure?.githubAccessToken
  if (!accessToken) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  function epochToDate(epoch: number | undefined) {
    if (!epoch) return undefined
    return new Date(epoch * 1000).toISOString()
  }

  const runtimeConfig = useRuntimeConfig()
  const withPlugins = Octokit.plugin(restEndpointMethods, paginateRest)
  const octokit: Octokit &
    Api & {
      paginate: PaginateInterface
    } = new withPlugins({
    userAgent: 'Work-time-calc',
    authStrategy: createOAuthUserAuth,
    auth: {
      clientId: runtimeConfig.oauth.github.clientId,
      clientSecret: runtimeConfig.oauth.github.clientSecret,
      clientType: 'github-app',
      token: accessToken,

      expiresAt: epochToDate(session.secure?.githubAccessTokenExpires),
      refreshTokenExpires: epochToDate(session.secure?.githubRefreshTokenExpires),
      refreshToken: session.secure?.githubRefreshToken,
    },
    log: console,
  })
  try {
    console.log('About to authanticate')
    const authRes = (await octokit.auth({})) as GitHubAppAuthenticationWithExpiration
    console.log('Authanticated')

    if (authRes.token != accessToken || session.secure?.githubRefreshToken != authRes.refreshToken) {
      console.log('Token was changed, updating session')
      await setUserSession(event, {
        secure: {
          githubAccessToken: authRes.token,
          githubRefreshToken: authRes.refreshToken,
          githubAccessTokenExpires: new Date(authRes.expiresAt).getTime() / 1000,
          githubRefreshTokenExpires: new Date(authRes.refreshTokenExpiresAt).getTime() / 1000,
        },
      })
    }

    return octokit
  } catch (e) {
    console.error('Error authenticating with GitHub', e)
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
}
