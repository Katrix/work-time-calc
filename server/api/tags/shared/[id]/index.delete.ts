import z from 'zod'

export default defineEventHandler(async (event) => {
  const { id: publicId } = await getValidatedRouterParams(event, z.object({ id: customNanoId }).parse)

  const session = await requireUserSession(event)
  const githubId = session.user.githubId

  const deleted = await usePrisma(event).sharedTag.deleteMany({
    where: { publicId, createdById: githubId },
  })

  if (deleted.count === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Tag not found' })
  }

  setResponseStatus(event, 204)
})
