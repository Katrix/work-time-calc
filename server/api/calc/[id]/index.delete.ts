import z from 'zod'

export default defineEventHandler(async (event) => {
  const { id: publicId } = await getValidatedRouterParams(
    event,
    z.object({ id: z.nanoid() }).parse,
  )

  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  await usePrisma(event).calc.delete({
    where: { publicId, createdById: githubId },
  })

  setResponseStatus(event, 204)
})
