import { nanoid } from 'nanoid'

const schema = sharedTag.extend({ publicId: customNanoId.optional() })

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const githubId = session.user.githubId

  const tag = await readValidatedBody(event, schema.parse)

  const prisma = usePrisma(event)

  const existing = !tag.publicId
    ? null
    : await prisma.sharedTag.findUnique({
        select: { id: true },
        where: { publicId: tag.publicId, createdById: githubId },
      })

  if (!existing) {
    const publicId = nanoid(12)
    await prisma.sharedTag.create({ data: { ...tag, publicId, createdById: githubId } })

    setResponseStatus(event, 201)
    return { publicId }
  } else if (tag.publicId) {
    const updated = await prisma.sharedTag.updateManyAndReturn({
      where: { publicId: tag.publicId, createdById: githubId },
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

    return { publicId: tag.publicId }
  }
})
