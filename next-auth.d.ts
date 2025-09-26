declare module 'next-auth' {
  interface JWT {
    sessionToken?: string
  }
}
