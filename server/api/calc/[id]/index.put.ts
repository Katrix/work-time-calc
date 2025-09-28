import z from 'zod'

export default defineEventHandler(async (event) => {
  const { id: publicId } = await getValidatedRouterParams(event, z.object({ id: z.nanoid() }).parse)

  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const c = await readValidatedBody(event, calcSchema.parse)

  const prisma = usePrisma(event)
  const calcId = await prisma.calc.findUnique({ where: { publicId }, select: { id: true } })
  if (!calcId) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  await prisma.calc.update({
    where: {
      id: calcId.id,
      createdById: githubId,
    },
    data: {
      createdById: githubId,
      updatedAt: new Date(),
      name: c.name,
      mode: c.mode,
      savedUpTime: c.savedUpTime,
      savedUpVacation: c.savedUpVacation,
      workTime: c.workTime,
      defaultFrom: c.defaultFrom,
      defaultTo: c.defaultTo,
      precision: c.precision,
      tags: {
        deleteMany: {
          NOT: {
            tag: { in: [...c.tags.keys()] },
          },
        },
        upsert: [...c.tags.entries()].map(([tag, color]) => ({
          where: {
            calcId_tag: {
              calcId: calcId.id,
              tag
            }
          },
          update: {
            color,
          },
          create: {
            calcId: calcId.id,
            tag,
            color
          }
        })),
      },
    },
  })

  setResponseStatus(event, 204)
})
