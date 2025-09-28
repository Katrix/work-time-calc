import z from 'zod'
import { notInArray } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { preset: presetName } = await getValidatedRouterParams(event, z.object({ preset: z.string() }).parse)

  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const github = await readValidatedBody(event, presetGithub.parse)
  const drizzle = useDrizzle()

  await drizzle.batch([
    drizzle
      .insert(tables.presetGithubRepo)
      .values(
        [...github.repos.entries()].flatMap(([owner, repos]) =>
          repos.map((repo) => ({
            owner,
            repo: repo.name,
            partOfName: presetName,
            autocompleteWithoutOwner: repo.autocompleteWithoutOwner,
          })),
        ),
      )
      .onConflictDoUpdate({
        target: [tables.presetGithubRepo.partOfName, tables.presetGithubRepo.owner, tables.presetGithubRepo.repo],
        set: { autocompleteWithoutOwner: sql.raw(`excluded.${tables.presetGithubRepo.autocompleteWithoutOwner.name}`) },
      }),
    drizzle.delete(tables.presetGithubRepo).where(
      and(
        eq(tables.presetGithubRepo.partOfName, presetName),
        notInArray(
          sql`concat(${tables.presetGithubRepo.owner}, '/', ${tables.presetGithubRepo.repo})`,
          [...github.repos.entries()].map(([owner, repos]) => repos.map((repo) => `${owner}/${repo.name}`)),
        ),
      ),
    ),
    drizzle
      .insert(tables.presetGithubOwner)
      .values(github.owners.map((owner) => ({ owner, partOfName: presetName })))
      .onConflictDoNothing(),
    drizzle
      .delete(tables.presetGithubOwner)
      .where(
        and(
          eq(tables.presetGithubOwner.partOfName, presetName),
          notInArray(tables.presetGithubOwner.owner, github.owners),
        ),
      ),
  ])

  setResponseStatus(event, 204)
})
