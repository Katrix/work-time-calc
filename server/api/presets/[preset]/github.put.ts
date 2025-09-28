import z from 'zod'

export default defineEventHandler(async (event) => {
  const { preset: presetName } = await getValidatedRouterParams(event, z.object({ preset: z.string() }).parse)

  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const github = await readValidatedBody(event, z.record(z.string(), presetGithubOwnerSchema).parse)
  const prisma = usePrisma(event)

  const presetId = await getPresetId(event, githubId, presetName)

  await prisma.preset.update({
    where: {
      id: presetId,
    },
    data: {
      githubOwners: {
        deleteMany: {
          NOT: {
            owner: {
              in: Object.keys(github),
            },
          },
        },
        upsert: Object.entries(github).map(([owner, ownerData]) => ({
          where: {
            presetId_owner: {
              presetId,
              owner,
            },
          },
          create: {
            owner,
            active: ownerData.active,
            autocompleteWithoutOwner: ownerData.autocompleteWithoutOwner,
          },
          update: {
            owner,
            active: ownerData.active,
            autocompleteWithoutOwner: ownerData.autocompleteWithoutOwner,
          },
        })),
      },
      githubRepos: {
        deleteMany: {
          NOT: {
            OR: Object.entries(github).flatMap(([owner, { repos }]) =>
              [...repos.keys()].map((repo) => ({
                owner,
                repo,
              })),
            ),
          },
        },
        upsert: Object.entries(github).flatMap(([owner, { repos }]) =>
          [...repos.entries()].map(([repo, repoData]) => ({
            where: {
              presetId_owner_repo: {
                presetId,
                owner,
                repo,
              },
            },
            create: {
              owner,
              repo,
              autocompleteWithoutRepository: repoData.autocompleteWithoutRepository,
            },
            update: {
              owner,
              repo,
              autocompleteWithoutRepository: repoData.autocompleteWithoutRepository,
            },
          })),
        ),
      },
    },
  })

  await setPresetsUpdatedNow(event, githubId)

  return null
})
