import type { SecureSessionData } from '#auth-utils'
import z from 'zod'

const refreshTokensSchema = z.object({
  refresh_token: z.string().optional(),
  expires_in: z.number().or(z.coerce.number()).optional(),
  refresh_token_expires_in: z.number().or(z.coerce.number()).optional(),
})

export default defineOAuthGitHubEventHandler({
  config: {
    emailRequired: true,
    scope: [],
  },
  async onSuccess(event, { user, tokens }) {
    if (!user.email) {
      throw createError({ statusCode: 400, statusMessage: 'Email is required' })
    }

    await useDrizzle()
      .insert(tables.user)
      .values({
        id: user.id,
        username: user.login,
        email: user.email,
      })
      .onConflictDoNothing()
      .execute()

    const secure: SecureSessionData = {
      githubAccessToken: tokens.access_token,
    }

    const parsedTokens = refreshTokensSchema.safeParse(tokens)

    if (parsedTokens.success && parsedTokens.data.refresh_token) {
      const t = parsedTokens.data
      secure.githubRefreshToken = t.refresh_token
      secure.githubAccessTokenExpires = t.expires_in ? Date.now() / 1000 + t.expires_in : undefined
      secure.githubRefreshTokenExpires = t.refresh_token_expires_in
        ? Date.now() / 1000 + t.refresh_token_expires_in
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
  onError(event, error) {
    console.error('GitHub OAuth error:', error)
    return sendRedirect(event, '/')
  },
})
