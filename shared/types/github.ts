import z from 'zod'

export const githubRepoInfoSchema = z.object({
  owner: z.object({
    login: z.string(),
  }),
  name: z.string(),
  url: z.string(),
})
export type GithubRepoInfo = z.infer<typeof githubRepoInfoSchema>
