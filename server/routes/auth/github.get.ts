export default defineOAuthGitHubEventHandler({
  config: {
    emailRequired: true,
    scope: ['read:user', 'user:email', 'repo'],
  },
  async onSuccess(event, { user, tokens }) {
    await setUserSession(event, {
      user: {
        githubUsername: user.login,
        githubId: user.id,
      },
      secure: {
        githubAccessToken: tokens.access_token,
      },
    })
    return sendRedirect(event, '/')
  },
  // Optional, will return a json error and 401 status code by default
  onError(event, error) {
    console.error('GitHub OAuth error:', error)
    return sendRedirect(event, '/')
  },
})
