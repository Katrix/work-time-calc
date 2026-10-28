export function isValidPresetName(name: string): boolean {
  return name !== '' && !name.includes('/')
}
