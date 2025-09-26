import GithubProvider from 'next-auth/providers/github'
import { NuxtAuthHandler } from '#auth'

const config = useRuntimeConfig()
export default NuxtAuthHandler({
  secret: config.authSecret,
  providers: [
    (() => {
      // @ts-expect-error Use .default here for it to work during SSR.
      const functionToUse = typeof GithubProvider.default === 'function' ? GithubProvider.default : GithubProvider
      throw new Error(
        `Debugging ${JSON.stringify({
          clientId: config.githubClientId,
          provider: typeof GithubProvider,
          providerDefault: typeof (GithubProvider as any).default,
          functionToUse: functionToUse(),
        })}`,
      )
      const res = functionToUse({
        clientId: config.githubClientId,
        clientSecret: config.githubClientSecret,
        //authorization: {
        //  params: { scope: 'read:user user:email repo' },
        //},
      })
      console.log(res)
      return res
    })(),
  ],
  // your authentication configuration here!
  // callbacks: {
  //   jwt({ token, account }) {
  //     if (account) {
  //       token.sessionToken = account.session_token
  //     }
  //     return token
  //   },
  // },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/new-user',
  },
})
