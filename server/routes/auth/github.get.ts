import type { SecureSessionData } from '#auth-utils'
import z from 'zod'

const refreshTokensSchema = z.object({
  refresh_token: z.string().optional(),
  expires_in: z.number().optional(),
  refresh_token_expires_in: z.number().optional(),
})

export default defineOAuthGitHubEventHandler({
  config: {
    emailRequired: true,
    scope: ['read:user', 'user:email', 'repo'],
  },
  async onSuccess(event, { user, tokens }) {
    const secure: SecureSessionData = {
      githubAccessToken: tokens.access_token,
    }

    const parsedTokens = refreshTokensSchema.safeParse(tokens)

    if (parsedTokens.success && parsedTokens.data.refresh_token) {
      const t = parsedTokens.data
      secure.githubRefreshToken = t.refresh_token
      secure.githubAccessTokenExpires = t.expires_in ? Date.now() / 1000 + t.expires_in : undefined
      secure.githubRefreshTokenExpires = t.refresh_token_expires_in
        ? Date.now() / 1000 + t.refresh_token_expires_in - 60 * 60 * 24 * 7
        : undefined
    }

    await setUserSession(
      event,
      {
        user: {
          githubUsername: user.login,
          githubId: user.id,
        },
        secure,
      },
      {
        maxAge: parsedTokens.data?.refresh_token_expires_in,
      },
    )
    return sendRedirect(event, '/')
  },
  // Optional, will return a json error and 401 status code by default
  onError(event, error) {
    console.error('GitHub OAuth error:', error)
    return sendRedirect(event, '/')
  },
})
