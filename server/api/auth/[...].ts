import GithubProvider from 'next-auth/providers/github'
import { NuxtAuthHandler } from '#auth'

const config = useRuntimeConfig()
export default NuxtAuthHandler({
  secret: config.authSecret,
  providers: [
    // // @ts-expect-error Use .default here for it to work during SSR.
    GithubProvider({
      clientId: config.githubClientId,
      clientSecret: config.githubClientSecret,
      authorization: {
        params: { scope: 'read:user user:email repo' },
      },
    }),
  ],
  // your authentication configuration here!
  callbacks: {
    jwt({ token, account }) {
      if (account) {
        token.sessionToken = account.session_token
      }
      return token
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/new-user',
  },
})
