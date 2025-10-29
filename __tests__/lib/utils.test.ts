import { cn } from '@/lib/utils'

describe('cn utility function', () => {
  describe('Happy Path Tests', () => {
    it('should merge single class name', () => {
      expect(cn('foo')).toBe('foo')
    })

    it('should merge multiple class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('should handle Tailwind classes', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    })

    it('should merge conditional classes', () => {
      expect(cn('foo', true && 'bar', false && 'baz')).toBe('foo bar')
    })

    it('should handle array of classes', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar')
    })

    it('should handle objects with boolean values', () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz')
    })

    it('should handle complex nested structures', () => {
      expect(cn('base', ['nested', { conditional: true }], 'final')).toBe('base nested conditional final')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty input', () => {
      expect(cn()).toBe('')
    })

    it('should handle null and undefined', () => {
      expect(cn(null, undefined, 'foo')).toBe('foo')
    })

    it('should handle empty strings', () => {
      expect(cn('', 'foo', '')).toBe('foo')
    })

    it('should handle only falsy values', () => {
      expect(cn(false, null, undefined, '')).toBe('')
    })

    it('should deduplicate conflicting Tailwind classes', () => {
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    })

    it('should handle spacing classes correctly', () => {
      expect(cn('p-4', 'px-6')).toBe('p-4 px-6')
    })

    it('should handle deeply nested arrays', () => {
      expect(cn(['foo', ['bar', ['baz']]])).toBe('foo bar baz')
    })
  })

  describe('Tailwind Merge Functionality', () => {
    it('should resolve conflicting width classes', () => {
      expect(cn('w-10', 'w-20')).toBe('w-20')
    })

    it('should resolve conflicting height classes', () => {
      expect(cn('h-full', 'h-screen')).toBe('h-screen')
    })

    it('should handle multiple conflicting utilities', () => {
      expect(cn('bg-red-500 text-white', 'bg-blue-500')).toBe('text-white bg-blue-500')
    })

    it('should not merge non-conflicting classes', () => {
      const result = cn('text-white', 'bg-black', 'rounded')
      expect(result).toContain('text-white')
      expect(result).toContain('bg-black')
      expect(result).toContain('rounded')
    })

    it('should handle responsive variants', () => {
      expect(cn('w-10', 'md:w-20')).toBe('w-10 md:w-20')
    })

    it('should handle hover and focus states', () => {
      expect(cn('hover:bg-red-500', 'focus:bg-blue-500')).toBe('hover:bg-red-500 focus:bg-blue-500')
    })
  })

  describe('Type Safety Tests', () => {
    it('should accept strings', () => {
      expect(() => cn('test')).not.toThrow()
    })

    it('should accept numbers', () => {
      expect(() => cn(1 as any)).not.toThrow()
    })

    it('should accept boolean conditionals', () => {
      expect(() => cn(true && 'test', false && 'ignore')).not.toThrow()
    })

    it('should accept mixed types', () => {
      expect(() => cn('string', ['array'], { object: true }, null, undefined)).not.toThrow()
    })
  })

  describe('Performance Tests', () => {
    it('should handle large number of classes efficiently', () => {
      const manyClasses = Array.from({ length: 100 }, (_, i) => `class-${i}`)
      const start = performance.now()
      const result = cn(...manyClasses)
      const end = performance.now()
      
      expect(result).toContain('class-0')
      expect(result).toContain('class-99')
      expect(end - start).toBeLessThan(100) // Should complete in less than 100ms
    })
  })
})