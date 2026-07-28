import { describe, expect, it } from 'vitest'
import { parseTaskIdFromUrl } from './taskUrlParser'

describe('parseTaskIdFromUrl', () => {
  it('parses classic web#id= URLs', () => {
    expect(parseTaskIdFromUrl('https://x.odoo.com/web#id=123&model=project.task&view_type=form')).toBe(123)
  })

  it('parses ?id= query URLs', () => {
    expect(parseTaskIdFromUrl('https://x.odoo.com/odoo/project?id=456')).toBe(456)
  })

  it('parses /project/task/<id> URLs', () => {
    expect(parseTaskIdFromUrl('https://x.odoo.com/project/task/789')).toBe(789)
  })

  it('parses trailing numeric path segment URLs', () => {
    expect(parseTaskIdFromUrl('https://x.odoo.com/odoo/project/321')).toBe(321)
  })

  it('throws when no id can be found', () => {
    expect(() => parseTaskIdFromUrl('https://x.odoo.com/web#model=project.task')).toThrow(/Could not find a task id/)
  })
})
