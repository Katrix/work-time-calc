import { H3Event } from 'h3'
import z from 'zod'

export async function useAccessToken(event: H3Event) {
  const session = await getUserSession(event)
  let accessToken = session.secure?.githubAccessToken
  if (!accessToken) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const refreshExpired = session.secure?.githubRefreshTokenExpires
    ? session.secure.githubRefreshTokenExpires <= Date.now() / 1000
    : false

  if (refreshExpired) {
    throw createError({ statusCode: 401, statusMessage: 'Refresh token expired' })
  }

  const accessTokenExpired = session.secure?.githubAccessTokenExpires
    ? session.secure.githubAccessTokenExpires <= Date.now() / 1000
    : false

  if (accessTokenExpired) {
    if (!session.secure?.githubRefreshToken) {
      throw createError({ statusCode: 401, statusMessage: 'Refresh token required' })
    }

    const refreshRes = await refreshAccessToken(session.secure.githubRefreshToken)
    accessToken = refreshRes.access_token

    await setUserSession(event, {
      secure: {
        githubAccessToken: accessToken,
        githubAccessTokenExpires: Date.now() / 1000 + refreshRes.expires_in,
      },
    })
  }

  return accessToken
}

const refreshTokenSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
})

async function refreshAccessToken(refreshToken: string) {
  const runtimeConfig = useRuntimeConfig()
  const response = await $fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    query: {
      client_id: runtimeConfig.github.clientId,
      client_secret: runtimeConfig.github.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    },
  })
  return refreshTokenSchema.parse(response)
}
