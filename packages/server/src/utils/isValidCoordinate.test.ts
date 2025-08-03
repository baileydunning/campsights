import { describe, it, expect } from 'vitest'
import { isValidCoordinate } from './isValidCoordinate'

describe('isValidCoordinate', () => {
  it('returns true for valid coordinates', () => {
    expect(isValidCoordinate(45, 90)).toBe(true)
    expect(isValidCoordinate(-90, -180)).toBe(true)
    expect(isValidCoordinate(90, 180)).toBe(true)
    expect(isValidCoordinate(12.345, -67.89)).toBe(true)
  })

  it('returns false for coordinates out of latitude range', () => {
    expect(isValidCoordinate(-91, 0)).toBe(false)
    expect(isValidCoordinate(91, 0)).toBe(false)
    expect(isValidCoordinate(100, 50)).toBe(false)
    expect(isValidCoordinate(-100, 50)).toBe(false)
  })

  it('returns false for coordinates out of longitude range', () => {
    expect(isValidCoordinate(0, -181)).toBe(false)
    expect(isValidCoordinate(0, 181)).toBe(false)
    expect(isValidCoordinate(45, 200)).toBe(false)
    expect(isValidCoordinate(45, -200)).toBe(false)
  })

  it('returns false for (0, 0)', () => {
    expect(isValidCoordinate(0, 0)).toBe(false)
  })

  it('returns false for NaN values', () => {
    expect(isValidCoordinate(NaN, 0)).toBe(false)
    expect(isValidCoordinate(0, NaN)).toBe(false)
    expect(isValidCoordinate(NaN, NaN)).toBe(false)
  })

  it('returns false for non-number types', () => {
    // @ts-expect-error Testing non-number inputs
    expect(isValidCoordinate('45', 90)).toBe(false)
    // @ts-expect-error Testing non-number inputs
    expect(isValidCoordinate(45, '90')).toBe(false)
    // @ts-expect-error Testing non-number inputs
    expect(isValidCoordinate(null, 90)).toBe(false)
    // @ts-expect-error Testing non-number inputs
    expect(isValidCoordinate(45, undefined)).toBe(false)
  })
})
