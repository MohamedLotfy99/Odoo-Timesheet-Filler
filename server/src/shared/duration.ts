const DURATION_PATTERN = /^([0-9]{1,3}):([0-5][0-9])$/

/** Parses an "HH:MM" duration string into decimal hours for Odoo's `unit_amount`. */
export function parseDuration(input: string): number {
  const match = DURATION_PATTERN.exec(input.trim())
  if (!match) {
    throw new Error(`Invalid duration "${input}" — expected HH:MM (e.g. 01:20).`)
  }
  const hours = Number(match[1])
  const minutes = Number(match[2])
  return hours + minutes / 60
}

/** Converts decimal hours (Odoo's `unit_amount`) back into an "HH:MM" string. */
export function formatDuration(hours: number): string {
  const totalMinutes = Math.round(hours * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
