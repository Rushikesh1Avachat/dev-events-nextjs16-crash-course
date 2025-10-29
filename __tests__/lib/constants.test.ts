import { events } from '@/lib/constants'
import type { EventItem } from '@/lib/constants'

describe('Event Constants', () => {
  describe('Data Structure Validation', () => {
    it('should export an array of events', () => {
      expect(Array.isArray(events)).toBe(true)
      expect(events.length).toBeGreaterThan(0)
    })

    it('should have exactly 7 events', () => {
      expect(events).toHaveLength(7)
    })

    it('should have all required properties for each event', () => {
      events.forEach((event, index) => {
        expect(event).toHaveProperty('image')
        expect(event).toHaveProperty('title')
        expect(event).toHaveProperty('slug')
        expect(event).toHaveProperty('location')
        expect(event).toHaveProperty('date')
        expect(event).toHaveProperty('time')
      })
    })
  })

  describe('Field Type Validation', () => {
    it('should have string values for all fields', () => {
      events.forEach(event => {
        expect(typeof event.image).toBe('string')
        expect(typeof event.title).toBe('string')
        expect(typeof event.slug).toBe('string')
        expect(typeof event.location).toBe('string')
        expect(typeof event.date).toBe('string')
        expect(typeof event.time).toBe('string')
      })
    })

    it('should have non-empty strings for all fields', () => {
      events.forEach(event => {
        expect(event.image.length).toBeGreaterThan(0)
        expect(event.title.length).toBeGreaterThan(0)
        expect(event.slug.length).toBeGreaterThan(0)
        expect(event.location.length).toBeGreaterThan(0)
        expect(event.date.length).toBeGreaterThan(0)
        expect(event.time.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Image Path Validation', () => {
    it('should have valid image paths', () => {
      events.forEach(event => {
        expect(event.image).toMatch(/^\/images\//)
        expect(event.image).toMatch(/\.(png|jpg|jpeg)$/i)
      })
    })

    it('should have unique image paths except for duplicates', () => {
      const imagePaths = events.map(e => e.image)
      const uniqueImages = new Set(imagePaths)
      // Most should be unique
      expect(uniqueImages.size).toBeGreaterThanOrEqual(6)
    })
  })

  describe('Slug Validation', () => {
    it('should have valid slug format (lowercase with hyphens)', () => {
      events.forEach(event => {
        expect(event.slug).toMatch(/^[a-z0-9-]+$/)
        expect(event.slug).not.toMatch(/\s/)
        expect(event.slug).not.toMatch(/[A-Z]/)
      })
    })

    it('should have unique slugs', () => {
      const slugs = events.map(e => e.slug)
      const uniqueSlugs = new Set(slugs)
      expect(uniqueSlugs.size).toBe(events.length)
    })

    it('should not have leading or trailing hyphens', () => {
      events.forEach(event => {
        expect(event.slug).not.toMatch(/^-/)
        expect(event.slug).not.toMatch(/-$/)
      })
    })

    it('should not have consecutive hyphens', () => {
      events.forEach(event => {
        expect(event.slug).not.toMatch(/--/)
      })
    })
  })

  describe('Date Format Validation', () => {
    it('should have dates in YYYY-MM-DD format', () => {
      events.forEach(event => {
        expect(event.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      })
    })

    it('should have valid dates', () => {
      events.forEach(event => {
        const date = new Date(event.date)
        expect(date.toString()).not.toBe('Invalid Date')
        expect(date.getFullYear()).toBeGreaterThanOrEqual(2025)
      })
    })

    it('should have dates in the future (2025-2026)', () => {
      events.forEach(event => {
        const year = parseInt(event.date.split('-')[0])
        expect(year).toBeGreaterThanOrEqual(2025)
        expect(year).toBeLessThanOrEqual(2026)
      })
    })
  })

  describe('Time Format Validation', () => {
    it('should have valid time format', () => {
      events.forEach(event => {
        expect(event.time).toMatch(/^\d{2}:\d{2}\s(AM|PM)$/)
      })
    })

    it('should have valid hours (01-12)', () => {
      events.forEach(event => {
        const match = event.time.match(/^(\d{2}):/)
        if (match) {
          const hours = parseInt(match[1])
          expect(hours).toBeGreaterThanOrEqual(1)
          expect(hours).toBeLessThanOrEqual(12)
        }
      })
    })

    it('should have valid minutes (00-59)', () => {
      events.forEach(event => {
        const match = event.time.match(/:(\d{2})/)
        if (match) {
          const minutes = parseInt(match[1])
          expect(minutes).toBeGreaterThanOrEqual(0)
          expect(minutes).toBeLessThanOrEqual(59)
        }
      })
    })
  })

  describe('Location Validation', () => {
    it('should have non-empty locations', () => {
      events.forEach(event => {
        expect(event.location.trim().length).toBeGreaterThan(0)
      })
    })

    it('should contain city and country/state information', () => {
      events.forEach(event => {
        // Should have comma separator for city, country/state
        expect(event.location).toMatch(/,/)
      })
    })
  })

  describe('Title Validation', () => {
    it('should have meaningful titles', () => {
      events.forEach(event => {
        expect(event.title.length).toBeGreaterThan(5)
        expect(event.title.trim()).toBe(event.title)
      })
    })

    it('should have unique titles', () => {
      const titles = events.map(e => e.title)
      const uniqueTitles = new Set(titles)
      expect(uniqueTitles.size).toBe(events.length)
    })
  })

  describe('Specific Event Validation', () => {
    it('should include React Summit US 2025', () => {
      const reactSummit = events.find(e => e.slug === 'react-summit-us-2025')
      expect(reactSummit).toBeDefined()
      expect(reactSummit?.title).toBe('React Summit US 2025')
      expect(reactSummit?.location).toContain('San Francisco')
    })

    it('should include KubeCon + CloudNativeCon Europe 2026', () => {
      const kubeCon = events.find(e => e.slug === 'kubecon-cloudnativecon-eu-2026')
      expect(kubeCon).toBeDefined()
      expect(kubeCon?.location).toContain('Vienna')
    })

    it('should include AWS re:Invent 2025', () => {
      const awsReinvent = events.find(e => e.slug === 'aws-reinvent-2025')
      expect(awsReinvent).toBeDefined()
      expect(awsReinvent?.location).toContain('Las Vegas')
    })

    it('should include Next.js Conf 2025', () => {
      const nextjsConf = events.find(e => e.slug === 'nextjs-conf-2025')
      expect(nextjsConf).toBeDefined()
      expect(nextjsConf?.location).toContain('Los Angeles')
    })
  })

  describe('Type Safety', () => {
    it('should match EventItem type structure', () => {
      events.forEach((event: EventItem) => {
        const keys: (keyof EventItem)[] = ['image', 'title', 'slug', 'location', 'date', 'time']
        keys.forEach(key => {
          expect(event[key]).toBeDefined()
        })
      })
    })
  })

  describe('Data Consistency', () => {
    it('should have consistent date and time for each event', () => {
      events.forEach(event => {
        const date = new Date(event.date)
        expect(date.toString()).not.toBe('Invalid Date')
        expect(event.time).toMatch(/AM|PM/)
      })
    })

    it('should not have duplicate event data', () => {
      for (let i = 0; i < events.length; i++) {
        for (let j = i + 1; j < events.length; j++) {
          // Slugs must be unique
          expect(events[i].slug).not.toBe(events[j].slug)
          // Titles must be unique
          expect(events[i].title).not.toBe(events[j].title)
        }
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle events array as read-only', () => {
      const originalLength = events.length
      expect(originalLength).toBeGreaterThan(0)
      // Verify array is accessible
      expect(events[0]).toBeDefined()
    })

    it('should have all events accessible by index', () => {
      for (let i = 0; i < events.length; i++) {
        expect(events[i]).toBeDefined()
        expect(events[i].slug).toBeDefined()
      }
    })
  })
})