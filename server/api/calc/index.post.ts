import { nanoid } from 'nanoid'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const c = await readValidatedBody(event, calcWithEntriesV2Schema.parse)

  const publicId = nanoid(12)
  await usePrisma(event).calc.create({
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
})
