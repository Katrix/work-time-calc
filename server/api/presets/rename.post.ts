import z from 'zod'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const p = await readValidatedBody(event, z.object({ from: z.string(), to: z.string() }).parse)
  await useDrizzle().update(tables.preset).set({ name: p.to }).where(eq(tables.preset.name, p.from)).execute()

  setResponseStatus(event, 204)
})
