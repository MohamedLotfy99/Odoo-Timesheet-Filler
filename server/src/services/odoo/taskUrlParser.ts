const ID_PATTERNS = [
  /[?&#]id=(\d+)/, // .../web#id=123&model=project.task&view_type=form
  /\/project\/task\/(\d+)(?:[/?#]|$)/, // .../project/task/123
  /\/(\d+)(?:[/?#]|$)/ // trailing numeric path segment, e.g. .../odoo/project/123
]

/** Extracts a `project.task` record id from an Odoo task URL. Does not fetch or validate the id. */
export function parseTaskIdFromUrl(url: string): number {
  const trimmed = url.trim()
  for (const pattern of ID_PATTERNS) {
    const match = pattern.exec(trimmed)
    if (match) return Number(match[1])
  }
  throw new Error(`Could not find a task id in URL "${url}".`)
}
