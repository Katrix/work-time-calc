import z from 'zod'
import { notInArray } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { preset: presetName } = await getValidatedRouterParams(event, z.object({ preset: z.string() }).parse)

  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const github = await readValidatedBody(event, z.record(z.string(), presetGithubOwner).parse)
  const drizzle = useDrizzle()

  const presetId = await getPresetId(githubId, presetName)

  await drizzle.batch([
    drizzle
      .insert(tables.presetGithubRepo)
      .values(
        Object.entries(github).flatMap(([ownerName, owner]) =>
          [...owner.repos.entries()].map(([repoName, repo]) => ({
            owner: ownerName,
            presetId,
            repo: repoName,
            autocompleteWithoutRepository: repo.autocompleteWithoutRepository,
          })),
        ),
      )
      .onConflictDoUpdate({
        target: [tables.presetGithubRepo.presetId, tables.presetGithubRepo.owner, tables.presetGithubRepo.repo],
        set: {
          autocompleteWithoutRepository: sql.raw(
            `excluded.${tables.presetGithubRepo.autocompleteWithoutRepository.name}`,
          ),
        },
      }),
    drizzle.delete(tables.presetGithubRepo).where(
      and(
        eq(tables.presetGithubRepo.presetId, presetId),
        notInArray(
          sql`concat(${tables.presetGithubRepo.owner}, '/', ${tables.presetGithubRepo.repo})`,
          Object.entries(github).map(([ownerName, owner]) =>
            [...owner.repos.keys()].map((repo) => `${ownerName}/${repo}`),
          ),
        ),
      ),
    ),
    drizzle
      .insert(tables.presetGithubOwner)
      .values(
        Object.entries(github).map(([ownerStr, owner]) => ({
          owner: ownerStr,
          presetId,
          active: owner.active,
          autocompleteWithoutOwner: owner.autocompleteWithoutOwner,
        })),
      )
      .onConflictDoNothing(),
    drizzle
      .delete(tables.presetGithubOwner)
      .where(
        and(
          eq(tables.presetGithubOwner.presetId, presetId),
          notInArray(tables.presetGithubOwner.owner, Object.keys(github)),
        ),
      ),
    setPresetsUpdatedNow(githubId),
  ])

  return null
})
