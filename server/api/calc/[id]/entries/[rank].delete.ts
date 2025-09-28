import z from 'zod'

export default defineEventHandler(async (event) => {
  const { id: publicId, rank } = await getValidatedRouterParams(
    event,
    z.object({ id: z.nanoid(), rank: z.string() }).parse,
  )

  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  await usePrisma(event).calcEntry.deleteMany({
    where: { rank, calc: { createdById: githubId, publicId } },
  })

  setResponseStatus(event, 204)
})
