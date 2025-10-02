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
      await clearUserSession(event)
      throw createError({ statusCode: 401, statusMessage: 'Refresh token required' })
    }

    const refreshRes = await refreshAccessToken(session.secure.githubRefreshToken)
    if (!refreshRes.data || refreshRes.error) {
      throw createError({ statusCode: 401, statusMessage: 'Refresh token error' })
    }
    if ('error' in refreshRes.data) {
      await clearUserSession(event)
      throw createError({ statusCode: 401, statusMessage: 'Refresh token error' })
    }

    accessToken = refreshRes.data.access_token
    await setUserSession(event, {
      secure: {
        githubAccessToken: accessToken,
        githubRefreshToken: refreshRes.data.refresh_token,
        githubAccessTokenExpires: Date.now() / 1000 + refreshRes.data.expires_in,
      },
    })
  }

  return accessToken
}

const refreshTokenSchema = z
  .object({
    access_token: z.string(),
    refresh_token: z.string(),
    expires_in: z.number().or(z.coerce.number()),
  })
  .or(
    z.object({
      error: z.string(),
      error_description: z.string(),
      error_uri: z.string().optional(),
    }),
  )

async function refreshAccessToken(refreshToken: string) {
  const runtimeConfig = useRuntimeConfig()

  const response: string = await $fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    query: {
      client_id: runtimeConfig.oauth.github.clientId,
      client_secret: runtimeConfig.oauth.github.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    },
    responseType: 'text',
  })
  const urlParams = new URLSearchParams(response)
  const urlParamsObj = Object.fromEntries(urlParams.entries())

  return refreshTokenSchema.safeParse(urlParamsObj)
}
