import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('merges class names correctly', () => {
      const result = cn('bg-blue-500', 'text-white', 'p-4')
      expect(result).toBe('bg-blue-500 text-white p-4')
    })

    it('handles conditional classes', () => {
      const result = cn('bg-blue-500', false && 'hidden', 'text-white')
      expect(result).toBe('bg-blue-500 text-white')
    })

    it('handles undefined values', () => {
      const result = cn('bg-blue-500', undefined, 'text-white')
      expect(result).toBe('bg-blue-500 text-white')
    })

    it('handles conflicting classes', () => {
      const result = cn('bg-blue-500', 'bg-red-500')
      expect(result).toBe('bg-red-500')
    })

    it('handles empty input', () => {
      expect(cn()).toBe('')
      expect(cn('')).toBe('')
    })

    it('handles arrays of classes', () => {
      const result = cn(['bg-blue-500', 'text-white'], 'p-4')
      expect(result).toBe('bg-blue-500 text-white p-4')
    })

    it('handles objects with conditional classes', () => {
      const result = cn({
        'bg-blue-500': true,
        'bg-red-500': false,
        'text-white': true,
      })
      expect(result).toBe('bg-blue-500 text-white')
    })

    it('handles complex nested inputs', () => {
      const result = cn(
        'base-class',
        {
          'conditional-class': true,
          'hidden-class': false,
        },
        ['array-class-1', 'array-class-2'],
        null,
        undefined
      )
      expect(result).toBe('base-class conditional-class array-class-1 array-class-2')
    })
  })
})
