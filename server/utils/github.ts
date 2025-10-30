import { H3Event } from 'h3'
import { Octokit } from 'octokit'
import { createOAuthUserAuth, type GitHubAppAuthenticationWithExpiration } from '@octokit/auth-oauth-user'

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
  const octokit = new Octokit({
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
  })
  const authRes = (await octokit.auth({})) as GitHubAppAuthenticationWithExpiration

  await setUserSession(event, {
    secure: {
      githubAccessToken: authRes.token,
      githubRefreshToken: authRes.refreshToken,
      githubAccessTokenExpires: new Date(authRes.expiresAt).getTime() / 1000,
      githubRefreshTokenExpires: new Date(authRes.refreshTokenExpiresAt).getTime() / 1000,
    },
  })

  return octokit
}
