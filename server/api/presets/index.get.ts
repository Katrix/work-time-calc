export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const res = await useDrizzle().query.preset.findMany({
    with: {
      parts: {
        with: {
          tags: true,
        },
      },
      githubRepos: {
        columns: {
          owner: true,
          repo: true,
          autocompleteWithoutOwner: true,
        },
      },
      githubOwners: {
        columns: {
          owner: true,
        },
      },
    },
    where: (table, { eq }) => eq(table.createdById, githubId),
  })

  return res.map((rawPreset) => {
    const hoursPart = rawPreset.parts.find((part) => part.mode === 'hours')
    const tasksPart = rawPreset.parts.find((part) => part.mode === 'tasks')
    return {
      hours: hoursPart,
      tasks: tasksPart,
      github: {
        owners: rawPreset.githubOwners.map((owner) => owner.owner),
        repos: rawPreset.githubRepos.map((repo) => [
          repo.owner,
          { name: repo.repo, autocompleteWithoutOwner: repo.autocompleteWithoutOwner },
        ]),
      },
    }
  })
})
