import z from 'zod'

export default defineEventHandler(async (event) => {
  const { id: publicId } = await getValidatedRouterParams(event, z.object({ id: customNanoId }).parse)

  const session = await requireUserSession(event)
  const githubId = session.user.githubId

  const tag = await readValidatedBody(event, sharedTag.parse)

  const prisma = usePrisma(event)
  const updated = await prisma.sharedTag.updateManyAndReturn({
    where: { publicId, createdById: githubId },
    data: { ...tag },
    select: { id: true },
  })

  if (updated.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Tag not found' })
  }

  const id = updated[0].id
  await prisma.calcTag.updateMany({
    data: {
      name: tag.name,
      color: tag.color,
    },
    where: { sharedTagId: id },
  })

  setResponseStatus(event, 204)
})
