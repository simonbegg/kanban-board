import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('Utils', () => {
  describe('cn (classname utility)', () => {
    it('merges class names correctly', () => {
      const result = cn('class1', 'class2')
      expect(result).toBe('class1 class2')
    })

    it('handles conditional classes', () => {
      const result = cn('base', true && 'conditional', false && 'hidden')
      expect(result).toContain('base')
      expect(result).toContain('conditional')
      expect(result).not.toContain('hidden')
    })

    it('handles undefined and null values', () => {
      const result = cn('base', undefined, null, 'other')
      expect(result).toBe('base other')
    })

    it('handles empty strings', () => {
      const result = cn('base', '', 'other')
      expect(result).toBe('base other')
    })

    it('merges Tailwind classes with conflicts', () => {
      // tailwind-merge should resolve conflicts
      const result = cn('px-4', 'px-6')
      expect(result).toBe('px-6')
    })

    it('handles arrays of classes', () => {
      const result = cn(['class1', 'class2'], 'class3')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
      expect(result).toContain('class3')
    })

    it('handles objects with boolean values', () => {
      const result = cn({
        'always-present': true,
        'never-present': false,
      })
      expect(result).toContain('always-present')
      expect(result).not.toContain('never-present')
    })

    it('returns empty string for no arguments', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('handles complex combinations', () => {
      const result = cn(
        'base',
        {
          'active': true,
          'disabled': false,
        },
        ['flex', 'items-center'],
        undefined,
        'text-blue-500'
      )
      expect(result).toContain('base')
      expect(result).toContain('active')
      expect(result).not.toContain('disabled')
      expect(result).toContain('flex')
      expect(result).toContain('items-center')
      expect(result).toContain('text-blue-500')
    })
  })
})
