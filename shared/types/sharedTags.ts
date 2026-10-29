import z from 'zod'

export const sharedTag = z.object({
  name: z.string(),
  color: z.string()
})