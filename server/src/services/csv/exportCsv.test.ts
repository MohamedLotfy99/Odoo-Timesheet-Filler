import { describe, expect, it } from 'vitest'
import type { TimesheetRowInput } from '../../shared/types'
import { buildTimesheetCsv } from './exportCsv'

function row(overrides: Partial<TimesheetRowInput> = {}): TimesheetRowInput {
  return {
    id: 'row-1',
    url: '',
    description: 'Worked on stuff',
    duration: '01:20',
    date: '2026-07-28',
    ...overrides
  }
}

describe('buildTimesheetCsv', () => {
  it('emits the expected header row', () => {
    const { csv } = buildTimesheetCsv([], 'Jane Doe', 5, null)
    expect(csv.split('\r\n')[0]).toBe('name,project_id/.id,task_id/.id,unit_amount,date,employee_id')
  })

  it('writes the chosen project/task database ids into every row', () => {
    const { csv } = buildTimesheetCsv([row()], 'Jane Doe', 5, 42)
    const dataLine = csv.split('\r\n')[1]
    const fields = dataLine.split(',')
    expect(fields[1]).toBe('5')
    expect(fields[2]).toBe('42')
  })

  it('leaves task_id blank when no task was chosen', () => {
    const { csv } = buildTimesheetCsv([row()], 'Jane Doe', 5, null)
    const dataLine = csv.split('\r\n')[1]
    const fields = dataLine.split(',')
    expect(fields[2]).toBe('')
  })

  it('converts HH:MM duration into decimal hours', () => {
    const { csv } = buildTimesheetCsv([row({ duration: '01:20' })], 'Jane Doe', 5, null)
    const dataLine = csv.split('\r\n')[1]
    const fields = dataLine.split(',')
    expect(Number(fields[3])).toBeCloseTo(1.3333, 4)
  })

  it('uses the employee display name for the employee_id column', () => {
    const { csv } = buildTimesheetCsv([row()], 'Jane Doe', 5, null)
    expect(csv).toContain('Jane Doe')
  })

  it('escapes fields containing commas, quotes, or newlines', () => {
    const { csv } = buildTimesheetCsv(
      [row({ description: 'Fixed "bug", and wrote docs\nline two' })],
      'Jane Doe',
      5,
      null
    )
    const dataLine = csv.split('\r\n')[1]
    expect(dataLine).toContain('"Fixed ""bug"", and wrote docs\nline two"')
  })

  it('collects per-row errors for invalid durations without failing the whole export', () => {
    const rows = [row({ id: 'good', duration: '01:00' }), row({ id: 'bad', duration: 'nonsense' })]
    const { csv, errors } = buildTimesheetCsv(rows, 'Jane Doe', 5, null)
    expect(errors).toEqual([{ id: 'bad', error: expect.stringMatching(/Invalid duration/) }])
    expect(csv.split('\r\n').filter(Boolean)).toHaveLength(2) // header + 1 valid row
  })
})
