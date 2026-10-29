import { nanoid } from 'nanoid'
import z from 'zod'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const githubId = session.user.githubId

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
  const entriesByRank = c.entries.sort((a, b) => (a.rank < b.rank ? -1 : b.rank < a.rank ? 1 : 0))

  const prisma = usePrisma(event)
  const existing = !c.publicId
    ? null
    : await prisma.calc.findUnique({
        select: {
          id: true,
          updatedAt: true,
        },
        where: {
          publicId: c.publicId,
          createdById: githubId,
        },
      })

  if (!existing) {
    const publicId = nanoid(12)
    const { id: calcId, entries } = await prisma.calc.create({
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
      select: {
        id: true,
        entries: {
          select: {
            id: true,
          },
          orderBy: {
            rank: 'asc',
          },
        },
      },
    })

    await prisma.calcEntryTag.createMany({
      data: entriesByRank.flatMap((e, i) => (e.tags ?? []).map((t) => ({ calcId, entryId: entries[i].id, tag: t }))),
    })

    setResponseStatus(event, 201)
    return { publicId }
  } else if (c.publicId && existing.updatedAt.getTime() < c.updatedAt.getTime()) {
    const { entries } = await prisma.calc.update({
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
      select: {
        entries: {
          select: {
            id: true,
          },
          orderBy: {
            rank: 'asc',
          },
        },
      },
    })

    await prisma.calcEntryTag.createMany({
      data: entriesByRank.flatMap((e, i) =>
        (e.tags ?? []).map((t) => ({ calcId: existing.id, entryId: entries[i].id, tag: t })),
      ),
    })

    return { publicId: c.publicId }
  } else {
    setResponseStatus(event, 201)
    return
  }
})
