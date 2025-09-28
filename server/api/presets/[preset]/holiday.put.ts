import z from 'zod'

export default defineEventHandler(async (event) => {
  const { preset: presetName } = await getValidatedRouterParams(event, z.object({ preset: z.string() }).parse)

  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const r = await readValidatedBody(event, holidayRuleSchema.array().parse)
  const prisma = usePrisma(event)

  const presetId = await getPresetId(event, githubId, presetName)
  if (!presetId) {
    throw createError({ statusCode: 404, statusMessage: 'Preset not found' })
  }

  await prisma.preset.update({
    where: {
      id: presetId,
    },
    data: {
      easterHoliday: r.some((r) => r.type === 'easter'),
      ascensionHoliday: r.some((r) => r.type === 'ascension'),
      pentecostHoliday: r.some((r) => r.type === 'pentecost'),
      christmasHoliday: r.some((r) => r.type === 'christmas'),
      saturdayHoliday: r.some((r) => r.type === 'saturday'),
      sundayHoliday: r.some((r) => r.type === 'sunday'),
      fixedHolidays: {
        deleteMany: {
          NOT: {
            OR: r.filter((r) => r.type === 'fixed').map((r) => ({ from: r.from.toString(), to: r.to.toString() })),
          },
        },
        create: r
          .filter((r) => r.type === 'fixed')
          .map((r) => ({
            from: r.from.toString(),
            to: r.to.toString(),
          })),
      },
    },
  })

  await setPresetsUpdatedNow(event, githubId)

  return null
})
