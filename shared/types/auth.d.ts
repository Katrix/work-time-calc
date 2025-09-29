declare module '#auth-utils' {
  interface User {
    githubUsername: string
    githubId: number
  }

  interface UserSession {
  }

  interface SecureSessionData {
    githubAccessToken: string
    githubRefreshToken?: string
    githubAccessTokenExpires?: number
    githubRefreshTokenExpires?: number
  }
}

export {}