import { nanoid } from 'nanoid'
import z from 'zod'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const extraParams = z.union([
    z.object({
      updatedAt: z.number().transform((v) => new Date(v)),
      publicId: z.string(),
    }),
    z.object({
      updatedAt: z.undefined().optional(),
      publicId: z.undefined().optional(),
    }),
  ])

  const c = await readValidatedBody(event, calcWithEntriesV2Schema.and(extraParams).parse)

  const prisma = usePrisma(event)
  const existing = !c.publicId
    ? null
    : await prisma.calc.findUnique({
        select: {
          updatedAt: true,
        },
        where: {
          publicId: c.publicId,
        },
      })

  if (!existing) {
    const publicId = nanoid(12)
    await prisma.calc.create({
      data: {
        publicId,
        createdById: githubId,
        name: c.name,
        mode: c.mode,
        savedUpTime: c.savedUpTime,
        savedUpVacation: c.savedUpVacation,
        workTime: c.workTime,
        defaultFrom: c.defaultFrom,
        defaultTo: c.defaultTo,
        precision: c.precision,
        tags: {
          create: [...c.tags.entries()].map(([tag, color]) => ({ tag, color })),
        },
        entries: {
          create: c.entries.map((e) => ({
            rank: e.rank,
            name: e.name,
            from: e.from,
            to: e.to,
            subtractedTime: e.subtractedTime,
            isTracking: e.isTracking ?? false,
            notes: e.notes,
          })),
        },
      },
    })

    setResponseStatus(event, 201)
    return { publicId }
  } else if (c.publicId && existing.updatedAt.getTime() < c.updatedAt.getTime()) {
    await prisma.calc.update({
      data: {
        name: c.name,
        mode: c.mode,
        updatedAt: c.updatedAt,
        savedUpTime: c.savedUpTime,
        savedUpVacation: c.savedUpVacation,
        workTime: c.workTime,
        defaultFrom: c.defaultFrom,
        defaultTo: c.defaultTo,
        precision: c.precision,
        tags: {
          deleteMany: {},
          create: [...c.tags.entries()].map(([tag, color]) => ({ tag, color })),
        },
        entries: {
          deleteMany: {},
          create: c.entries.map((e) => ({
            rank: e.rank,
            name: e.name,
            from: e.from,
            to: e.to,
            subtractedTime: e.subtractedTime,
            isTracking: e.isTracking ?? false,
            notes: e.notes,
          })),
        },
      },
      where: {
        publicId: c.publicId,
      },
    })

    return { publicId: c.publicId }
  } else {
    setResponseStatus(event, 201)
    return
  }
})
