import z from 'zod'
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const b = await readValidatedBody(event, z.object({ opened: z.string().array() }).parse)
  const prisma = usePrisma(event)

  const openedIds = await prisma.calc.findMany({
    where: {
      publicId: {
        in: b.opened,
      },
    },
    select: {
      id: true,
      publicId: true,
    },
  })

  await prisma.user.update({
    where: {
      id: githubId,
    },
    data: {
      lastUpatedOpenedCalcs: new Date(),
      openedCalcs: {
        deleteMany: {
          userId: githubId,
        },
        create: openedIds.map(({ id, publicId }) => ({
          userId: githubId,
          calcId: id,
          order: b.opened.indexOf(publicId),
        })),
      },
    },
  })

  setResponseStatus(event, 204)
})
