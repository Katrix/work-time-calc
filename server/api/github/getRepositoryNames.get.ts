export default defineEventHandler(async (event) => {
  const octokit = await useOctokit(event)
  const repos = await octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
    per_page: 100,
  })

  // Only take what we need from the response
  return githubRepoInfoSchema.array().parse(repos)
})
