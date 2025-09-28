import z from 'zod'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const p = await readValidatedBody(event, z.object({ from: z.string(), to: z.string() }).parse)
  const res = await useDrizzle()
    .update(tables.preset)
    .set({ name: p.to })
    .where(and(eq(tables.preset.name, p.from), eq(tables.preset.createdById, githubId)))
    .execute()

  if (res === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
  await setPresetsUpdatedNow(githubId).execute()

  return null
})
