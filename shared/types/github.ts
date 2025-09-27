import z from 'zod'

export const githubRepoInfo = z.object({
  owner: z.object({
    login: z.string(),
  }),
  name: z.string(),
  url: z.string(),
})
export type GithubRepoInfo = z.infer<typeof githubRepoInfo>
