export function setPresetsUpdatedNow(userId: number) {
  return useDrizzle()
    .update(tables.user)
    .set({ lastUpdatedPresets: sql`now()` })
    .where(eq(tables.user.id, userId))
}

export async function getPresetId(githubId: number, presetName: string) {
  const presetIdObj = await useDrizzle().query.preset.findFirst({
    columns: { id: true },
    where: and(eq(tables.preset.name, presetName), eq(tables.preset.createdById, githubId)),
  })
  if (!presetIdObj) {
    throw createError({ statusCode: 404, statusMessage: 'Preset not found' })
  }
  return presetIdObj.id
}
