import z from 'zod'
import { notInArray } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { preset: presetName } = await getValidatedRouterParams(event, z.object({ preset: z.string() }).parse)

  const session = await getUserSession(event)
  const githubId = session.user?.githubId
  if (!githubId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const r = await readValidatedBody(event, holidayRule.array().parse)
  const drizzle = useDrizzle()

  const presetId = await getPresetId(githubId, presetName)
  if (!presetId) {
    throw createError({ statusCode: 404, statusMessage: 'Preset not found' })
  }

  await drizzle.batch([
    drizzle.update(tables.preset).set({
      easterHoliday: r.some((r) => r.type === 'easter'),
      ascensionHoliday: r.some((r) => r.type === 'ascension'),
      pentecostHoliday: r.some((r) => r.type === 'pentecost'),
      christmasHoliday: r.some((r) => r.type === 'christmas'),
      saturdayHoliday: r.some((r) => r.type === 'saturday'),
      sundayHoliday: r.some((r) => r.type === 'sunday'),
    }),
    drizzle
      .insert(tables.presetFixedHoliday)
      .values(
        r.filter((r) => r.type === 'fixed').map((r) => ({ presetId, from: r.from.toString(), to: r.to.toString() })),
      ),
    drizzle.delete(tables.presetFixedHoliday).where(
      and(
        eq(tables.presetFixedHoliday.presetId, presetId),
        notInArray(
          sql`concat(${tables.presetFixedHoliday.from}, ' ', ${tables.presetFixedHoliday.to})`,
          r.filter((r) => r.type === 'fixed').map((r) => `${r.from} ${r.to}`),
        ),
      ),
    ),
  ])

  return null
})
