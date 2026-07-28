import { describe, expect, it } from 'vitest'
import { formatDuration, parseDuration } from './duration'

describe('parseDuration', () => {
  it('parses HH:MM into decimal hours', () => {
    expect(parseDuration('01:20')).toBeCloseTo(1.3333, 4)
    expect(parseDuration('00:30')).toBeCloseTo(0.5, 4)
    expect(parseDuration('02:00')).toBe(2)
  })

  it('trims surrounding whitespace', () => {
    expect(parseDuration('  01:00  ')).toBe(1)
  })

  it('rejects malformed input', () => {
    expect(() => parseDuration('1:20')).not.toThrow()
    expect(() => parseDuration('01-20')).toThrow(/Invalid duration/)
    expect(() => parseDuration('01:60')).toThrow(/Invalid duration/)
    expect(() => parseDuration('')).toThrow(/Invalid duration/)
  })
})

describe('formatDuration', () => {
  it('formats decimal hours back into HH:MM', () => {
    expect(formatDuration(1.3333)).toBe('01:20')
    expect(formatDuration(0.5)).toBe('00:30')
    expect(formatDuration(2)).toBe('02:00')
  })

  it('round-trips with parseDuration', () => {
    expect(formatDuration(parseDuration('01:20'))).toBe('01:20')
    expect(formatDuration(parseDuration('00:45'))).toBe('00:45')
  })
})
