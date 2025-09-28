import { type H3Event } from 'h3'

export function setPresetsUpdatedNow(event: H3Event, userId: number) {
  return usePrisma(event).user.update({ where: { id: userId }, data: { lastUpdatedPresets: new Date() } })
}

export async function getPresetId(event: H3Event, githubId: number, presetName: string) {
  const presetIdObj = await usePrisma(event).preset.findUnique({
    select: { id: true },
    where: {
      createdById_name: {
        createdById: githubId,
        name: presetName,
      },
    },
  })

  if (!presetIdObj) {
    throw createError({ statusCode: 404, statusMessage: 'Preset not found' })
  }
  return presetIdObj.id
}
