import { Octokit } from 'octokit'

export default defineEventHandler(async (event) => {
  const accessToken = await useAccessToken(event)

  const octokit = new Octokit({ userAgent: 'Work-time-calc', auth: accessToken })
  const repos = await octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
    per_page: 100,
  })

  // Only take what we need from the response
  return githubRepoInfo.array().parse(repos)
})
