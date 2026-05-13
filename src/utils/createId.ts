export function createId() {
  return `w-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
